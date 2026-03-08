using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;
using TagLib;
using System.IO;

namespace MuseArchive.API.Services;

public class MusicLibraryScanner
{
    private readonly MuseArchiveDbContext _context;
    private readonly ILogger<MusicLibraryScanner> _logger;
    private readonly string _musicPath;

    public MusicLibraryScanner(MuseArchiveDbContext context, ILogger<MusicLibraryScanner> logger, IWebHostEnvironment env)
    {
        _context = context;
        _logger = logger;
        _musicPath = @"C:\Users\poneling\Desktop\proje\music";
    }

    // â”€â”€â”€ PUBLIC ENTRY POINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task ScanAndImportMusicLibraryAsync()
    {
        if (!Directory.Exists(_musicPath))
        {
            _logger.LogWarning("Music directory not found: {Path}", _musicPath);
            return;
        }

        _logger.LogInformation("Starting music library scan at: {Path}", _musicPath);

        var allMp3s = Directory.GetFiles(_musicPath, "*.mp3", SearchOption.AllDirectories);
        _logger.LogInformation("Found {Count} MP3 files", allMp3s.Length);

        foreach (var mp3 in allMp3s)
        {
            try
            {
                await ProcessAndOrganizeAsync(mp3);
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to process {File}: {Msg}", mp3, ex.Message);
            }
        }

        CleanEmptyDirectories(_musicPath);
        _logger.LogInformation("Music library scan completed");
    }

    // â”€â”€â”€ CORE: READ TAGS â†’ MOVE FILE â†’ SAVE DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task ProcessAndOrganizeAsync(string originalPath)
    {
        // 1. Read ID3 tags — AlbumArtists has priority over Performers
        string tagArtist, tagAlbum, tagTitle, tagGenre;
        TimeSpan duration;
        byte[]? coverData = null;

        try
        {
            using var tagFile = TagLib.File.Create(originalPath);
            var tag = tagFile.Tag;

            // AlbumArtists first — more reliable for multi-artist / compiled albums
            tagArtist = FirstNonEmpty(
                tag.AlbumArtists?.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a)),
                tag.Performers?.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a)));

            tagAlbum  = tag.Album ?? "";
            tagTitle  = string.IsNullOrWhiteSpace(tag.Title)
                            ? Path.GetFileNameWithoutExtension(originalPath)
                            : tag.Title;
            tagGenre  = tag.FirstGenre ?? "";
            duration  = tagFile.Properties.Duration;

            // Extract embedded cover art (FrontCover preferred)
            var pic = tag.Pictures?.FirstOrDefault(p => p.Type == TagLib.PictureType.FrontCover)
                   ?? tag.Pictures?.FirstOrDefault();
            if (pic?.Data?.Data?.Length > 0)
                coverData = pic.Data.Data;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Cannot read tags for {File}: {Msg}", originalPath, ex.Message);
            tagArtist = "";
            tagAlbum  = "";
            tagTitle  = Path.GetFileNameWithoutExtension(originalPath);
            tagGenre  = "";
            duration  = TimeSpan.FromSeconds(180);
        }

        // 2. Fallback to folder-name parsing when tags are empty
        if (string.IsNullOrWhiteSpace(tagArtist) || string.IsNullOrWhiteSpace(tagAlbum))
        {
            var (fa, fb) = ParseFromFolderPath(originalPath);
            if (string.IsNullOrWhiteSpace(tagArtist)) tagArtist = fa;
            if (string.IsNullOrWhiteSpace(tagAlbum))  tagAlbum  = fb;
        }

        if (string.IsNullOrWhiteSpace(tagArtist)) tagArtist = "Unknown Artist";
        if (string.IsNullOrWhiteSpace(tagAlbum))  tagAlbum  = "Unknown Album";

        // 3. Build clean target path
        var cleanArtist = CleanPathName(tagArtist);
        var cleanAlbum  = CleanPathName(tagAlbum);
        var targetDir   = Path.Combine(_musicPath, cleanArtist, cleanAlbum);
        var targetFile  = Path.Combine(targetDir, Path.GetFileName(originalPath));

        // 4. Physically move the file if it's not already there
        string finalPath = originalPath;
        if (!string.Equals(originalPath, targetFile, StringComparison.OrdinalIgnoreCase))
        {
            Directory.CreateDirectory(targetDir);

            // Avoid collision
            if (System.IO.File.Exists(targetFile))
            {
                var stem = Path.GetFileNameWithoutExtension(originalPath);
                var ext  = Path.GetExtension(originalPath);
                targetFile = Path.Combine(targetDir, $"{stem}_{Guid.NewGuid().ToString("N")[..4]}{ext}");
            }

            System.IO.File.Move(originalPath, targetFile, overwrite: false);
            finalPath = targetFile;
            _logger.LogInformation("Moved â†’ {Target}", Path.GetRelativePath(_musicPath, targetFile));
        }

        // 5. Save cover.jpg into the album folder (if embedded art exists)
        var coverPath = Path.Combine(targetDir, "cover.jpg");
        if (coverData != null && !System.IO.File.Exists(coverPath))
        {
            try
            {
                await System.IO.File.WriteAllBytesAsync(coverPath, coverData);
                _logger.LogInformation("Saved cover art for {Album}", cleanAlbum);
            }
            catch (Exception ex) { _logger.LogWarning("Cover save failed: {Msg}", ex.Message); }
        }
        string? coverImageUrl = System.IO.File.Exists(coverPath)
            ? "/music/" + cleanArtist + "/" + cleanAlbum + "/cover.jpg"
            : null;

        // 6. Build audioUrl relative to music root
        var relative = Path.GetRelativePath(_musicPath, finalPath).Replace("\\", "/");
        var audioUrl = "/music/" + relative;

        // 7. Skip DB insert if track already exists
        if (await _context.Tracks.AnyAsync(t => t.AudioUrl == audioUrl))
        {
            // Still update cover URL if we just extracted one
            if (coverImageUrl != null)
            {
                var existingAlbum = await _context.Albums
                    .FirstOrDefaultAsync(a => a.Title.ToLower() == cleanAlbum.ToLower() && a.ArtistId != 0);
                if (existingAlbum != null && existingAlbum.CoverImageUrl == null)
                {
                    existingAlbum.CoverImageUrl = coverImageUrl;
                    await _context.SaveChangesAsync();
                }
            }
            return;
        }

        // 8. Upsert Artist / Album
        var artist = await GetOrCreateArtistAsync(cleanArtist);
        var album  = await GetOrCreateAlbumAsync(cleanAlbum, artist.Id, coverImageUrl);

        // 9. Insert Track
        var track = new Track
        {
            Title    = tagTitle,
            Duration = duration,
            AlbumId  = album.Id,
            AudioUrl = audioUrl,
            Genre    = string.IsNullOrWhiteSpace(tagGenre) ? null : tagGenre[..Math.Min(tagGenre.Length, 100)],
            PlayCount = 0
        };
        _context.Tracks.Add(track);
        await _context.SaveChangesAsync();

        _context.TrackArtists.Add(new TrackArtist { TrackId = track.Id, ArtistId = artist.Id }); // 10. Link artist
        await _context.SaveChangesAsync();

        _logger.LogInformation("Saved: {Title} [{Artist} â€“ {Album}]", tagTitle, cleanArtist, cleanAlbum);
    }

    // â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private static string FirstNonEmpty(params string?[] values)
        => values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)) ?? "";

    private (string artist, string album) ParseFromFolderPath(string filePath)
    {
        var relative = Path.GetRelativePath(_musicPath, filePath);
        var parts    = relative.Split(Path.DirectorySeparatorChar);

        if (parts.Length >= 3)
            return (parts[0], parts[1]);

        if (parts.Length == 2)
        {
            var dir = parts[0];
            if (dir.Contains(" - "))
            {
                var sp = dir.Split(new[] { " - " }, 2, StringSplitOptions.None);
                return (sp[0].Trim(), sp[1].Trim());
            }
            return (dir, dir);
        }
        return ("Unknown Artist", "Unknown Album");
    }

    private static string CleanPathName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Unknown";
        var invalid  = Path.GetInvalidFileNameChars();
        var cleaned  = new string(name.Where(c => !invalid.Contains(c)).ToArray()).Trim().TrimEnd('.');
        if (cleaned.Length > 100) cleaned = cleaned[..100].Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? "Unknown" : cleaned;
    }

    private void CleanEmptyDirectories(string root)
    {
        foreach (var dir in Directory.GetDirectories(root, "*", SearchOption.AllDirectories)
                                     .OrderByDescending(d => d.Length))
        {
            if (!Directory.EnumerateFileSystemEntries(dir).Any())
            {
                try { Directory.Delete(dir); } catch { /* ignore locked dirs */ }
            }
        }
    }

    private async Task<Artist> GetOrCreateArtistAsync(string name)
    {
        var artist = await _context.Artists
            .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower());

        if (artist != null) return artist;

        artist = new Artist { Name = name, Bio = $"Biography of {name}", ImageUrl = "/images/default-artist.jpg" };
        _context.Artists.Add(artist);
        await _context.SaveChangesAsync();
        return artist;
    }

    private async Task<Album> GetOrCreateAlbumAsync(string title, int artistId, string? coverImageUrl = null)
    {
        var album = await _context.Albums
            .FirstOrDefaultAsync(a => a.Title.ToLower() == title.ToLower() && a.ArtistId == artistId);

        if (album != null)
        {
            // Update cover if we have a real one now
            if (coverImageUrl != null && album.CoverImageUrl == null)
            {
                album.CoverImageUrl = coverImageUrl;
                await _context.SaveChangesAsync();
            }
            return album;
        }

        album = new Album
        {
            Title         = title,
            ArtistId      = artistId,
            ReleaseDate   = DateTime.UtcNow,
            CoverImageUrl = coverImageUrl,
        };
        _context.Albums.Add(album);
        await _context.SaveChangesAsync();
        return album;
    }

}
