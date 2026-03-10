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
        
        // Use project root directory (one level above backend) to find music folder
        var projectRoot = Directory.GetParent(env.ContentRootPath)?.FullName ?? env.ContentRootPath;
        _musicPath = Path.Combine(projectRoot, "music");
        
        // Ensure music directory exists
        if (!Directory.Exists(_musicPath))
        {
            Directory.CreateDirectory(_musicPath);
            _logger.LogInformation("Created music directory: {Path}", _musicPath);
        }
    }

    // ─── PUBLIC ENTRY POINT ──────────────────────────────────────────────────

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
                await ProcessFileAsync(mp3);
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to process {File}: {Msg}", mp3, ex.Message);
            }
        }

        _logger.LogInformation("Music library scan completed");
    }

    // ─── CORE: READ TAGS → SAVE DB (NO FILE MOVING) ─────────────────────────

    private async Task ProcessFileAsync(string filePath)
    {
        // 1. Parse artist & album from FOLDER NAME (primary source)
        //    Expected structure: {musicPath}/{Artist} - {Album}/song.mp3
        //    OR nested:          {musicPath}/{Artist}/{Album}/song.mp3
        var (folderArtist, folderAlbum) = ParseFromFolderPath(filePath);

        // 2. Read ID3 tags for title, genre, duration, cover art
        string tagTitle, tagGenre;
        TimeSpan duration;
        byte[]? coverData = null;

        try
        {
            using var tagFile = TagLib.File.Create(filePath);
            var tag = tagFile.Tag;

            tagTitle = string.IsNullOrWhiteSpace(tag.Title)
                           ? Path.GetFileNameWithoutExtension(filePath)
                           : tag.Title;
            tagGenre = tag.FirstGenre ?? "";
            duration = tagFile.Properties.Duration;

            // Extract embedded cover art (FrontCover preferred)
            var pic = tag.Pictures?.FirstOrDefault(p => p.Type == TagLib.PictureType.FrontCover)
                   ?? tag.Pictures?.FirstOrDefault();
            if (pic?.Data?.Data?.Length > 0)
                coverData = pic.Data.Data;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Cannot read tags for {File}: {Msg}", filePath, ex.Message);
            tagTitle = Path.GetFileNameWithoutExtension(filePath);
            tagGenre = "";
            duration = TimeSpan.FromSeconds(180);
        }

        // 3. Use folder-parsed artist & album names
        var artistName = string.IsNullOrWhiteSpace(folderArtist) ? "Unknown Artist" : folderArtist;
        var albumName  = string.IsNullOrWhiteSpace(folderAlbum)  ? "Unknown Album"  : folderAlbum;

        // 4. Save cover.jpg into the file's folder (if embedded art exists)
        var fileDir = Path.GetDirectoryName(filePath)!;
        var coverPath = Path.Combine(fileDir, "cover.jpg");
        if (coverData != null && !System.IO.File.Exists(coverPath))
        {
            try
            {
                await System.IO.File.WriteAllBytesAsync(coverPath, coverData);
                _logger.LogInformation("Saved cover art for {Album}", albumName);
            }
            catch (Exception ex) { _logger.LogWarning("Cover save failed: {Msg}", ex.Message); }
        }

        // 5. Build URLs relative to music root
        var relative = Path.GetRelativePath(_musicPath, filePath).Replace("\\", "/");
        var audioUrl = "/music/" + relative;

        var coverRelative = Path.GetRelativePath(_musicPath, coverPath).Replace("\\", "/");
        string? coverImageUrl = System.IO.File.Exists(coverPath)
            ? "/music/" + coverRelative
            : null;

        // 6. Skip if track already exists
        if (await _context.Tracks.AnyAsync(t => t.AudioUrl == audioUrl))
        {
            return;
        }

        // 7. Upsert Artist / Album
        var artist = await GetOrCreateArtistAsync(artistName);
        var album  = await GetOrCreateAlbumAsync(albumName, artist.Id, coverImageUrl);

        // 8. Insert Track
        var track = new Track
        {
            Title     = tagTitle,
            Duration  = duration,
            AlbumId   = album.Id,
            AudioUrl  = audioUrl,
            Genre     = string.IsNullOrWhiteSpace(tagGenre) ? null : tagGenre[..Math.Min(tagGenre.Length, 100)],
            PlayCount = 0
        };
        _context.Tracks.Add(track);
        await _context.SaveChangesAsync();

        // 9. Link artist
        _context.TrackArtists.Add(new TrackArtist { TrackId = track.Id, ArtistId = artist.Id });
        await _context.SaveChangesAsync();

        _logger.LogInformation("Saved: {Title} [{Artist} — {Album}]", tagTitle, artistName, albumName);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private (string artist, string album) ParseFromFolderPath(string filePath)
    {
        var relative = Path.GetRelativePath(_musicPath, filePath);
        var parts    = relative.Split(Path.DirectorySeparatorChar);

        // Nested: {Artist}/{Album}/song.mp3
        if (parts.Length >= 3)
            return (parts[0].Trim(), parts[1].Trim());

        // Flat: {Artist - Album}/song.mp3
        if (parts.Length == 2)
        {
            var dir = parts[0];
            if (dir.Contains(" - "))
            {
                var sp = dir.Split(new[] { " - " }, 2, StringSplitOptions.None);
                return (sp[0].Trim(), sp[1].Trim());
            }
            return (dir.Trim(), dir.Trim());
        }

        return ("Unknown Artist", "Unknown Album");
    }

    private async Task<Artist> GetOrCreateArtistAsync(string name)
    {
        var trimmed = name.Trim();
        var artist = await _context.Artists
            .FirstOrDefaultAsync(a => a.Name == trimmed);

        if (artist != null) return artist;

        artist = new Artist { Name = trimmed, Bio = $"Biography of {name}", ImageUrl = "/images/default-artist.jpg" };
        _context.Artists.Add(artist);
        await _context.SaveChangesAsync();
        return artist;
    }

    private async Task<Album> GetOrCreateAlbumAsync(string title, int artistId, string? coverImageUrl = null)
    {
        var trimmed = title.Trim();
        var album = await _context.Albums
            .FirstOrDefaultAsync(a => a.Title == trimmed && a.ArtistId == artistId);

        if (album != null)
        {
            if (coverImageUrl != null && album.CoverImageUrl == null)
            {
                album.CoverImageUrl = coverImageUrl;
                await _context.SaveChangesAsync();
            }
            return album;
        }

        album = new Album
        {
            Title         = trimmed,
            ArtistId      = artistId,
            ReleaseDate   = DateTime.UtcNow,
            CoverImageUrl = coverImageUrl,
        };
        _context.Albums.Add(album);
        await _context.SaveChangesAsync();
        return album;
    }
}
