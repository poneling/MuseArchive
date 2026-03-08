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

    public async Task ScanAndImportMusicLibraryAsync()
    {
        if (!Directory.Exists(_musicPath))
        {
            _logger.LogWarning($"Music directory not found: {_musicPath}");
            return;
        }

        _logger.LogInformation($"Starting music library scan at: {_musicPath}");

        var artistAlbumDirectories = Directory.GetDirectories(_musicPath);

        foreach (var artistAlbumDir in artistAlbumDirectories)
        {
            try
            {
                await ProcessArtistAlbumDirectory(artistAlbumDir);
                
                // Save changes after each directory to avoid conflicts
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing directory {artistAlbumDir}: {ex.Message}");
                
                // Clear changes to avoid conflicts
                _context.ChangeTracker.Clear();
            }
        }

        _logger.LogInformation("Music library scan completed");
    }

    private async Task ProcessArtistAlbumDirectory(string artistAlbumDir)
    {
        var dirName = Path.GetFileName(artistAlbumDir);
        var artistName = "Unknown Artist";
        var albumName = "Unknown Album";

        try
        {
            // Try different parsing strategies
            if (dirName.Contains(" - "))
            {
                var parts = dirName.Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    artistName = parts[0].Trim();
                    albumName = parts[1].Trim();
                }
            }
            else if (dirName.Contains(" -"))
            {
                var parts = dirName.Split(new[] { " -" }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    artistName = parts[0].Trim();
                    albumName = parts[1].Trim();
                }
            }
            else if (dirName.Contains("- "))
            {
                var parts = dirName.Split(new[] { "- " }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    artistName = parts[0].Trim();
                    albumName = parts[1].Trim();
                }
            }
            else if (dirName.Contains("-"))
            {
                var parts = dirName.Split(new[] { "-" }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2)
                {
                    artistName = parts[0].Trim();
                    albumName = parts[1].Trim();
                }
            }
            else
            {
                // If no separator found, use directory name as album
                albumName = dirName;
            }

            // Clean up artist and album names (remove special characters)
            artistName = CleanName(artistName);
            albumName = CleanName(albumName);

            _logger.LogInformation($"Processing: {dirName} -> Artist: {artistName}, Album: {albumName}");

            // Create or get artist
            var artist = await GetOrCreateArtistAsync(artistName);

            // Create or get album
            var album = await GetOrCreateAlbumAsync(albumName, artist.Id);

            // Process MP3 files
            var mp3Files = Directory.GetFiles(artistAlbumDir, "*.mp3", SearchOption.AllDirectories);
            
            foreach (var mp3File in mp3Files)
            {
                await ProcessTrackAsync(mp3File, album, artist);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error processing directory {artistAlbumDir}: {ex.Message}");
            
            // Fallback: create unknown artist/album and still process files
            try
            {
                var fallbackArtist = await GetOrCreateArtistAsync("Unknown Artist");
                var fallbackAlbum = await GetOrCreateAlbumAsync("Unknown Album", fallbackArtist.Id);
                
                var mp3Files = Directory.GetFiles(artistAlbumDir, "*.mp3", SearchOption.AllDirectories);
                foreach (var mp3File in mp3Files)
                {
                    await ProcessTrackAsync(mp3File, fallbackAlbum, fallbackArtist);
                }
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError($"Fallback processing failed for {artistAlbumDir}: {fallbackEx.Message}");
            }
        }
    }

    private string CleanName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Unknown";

        name = name.Trim();

        // If name is just empty brackets like "()" → use "Unknown"
        if (string.IsNullOrWhiteSpace(name.Replace("(", "").Replace(")", "").Replace("-", "").Replace("_", "")))
            return "Unknown";

        // Truncate to max DB field length (200 chars)
        if (name.Length > 200)
            name = name.Substring(0, 200);

        return name;
    }

    private async Task<Artist> GetOrCreateArtistAsync(string artistName)
    {
        var artist = await _context.Artists
            .FirstOrDefaultAsync(a => a.Name.ToLower() == artistName.ToLower());

        if (artist == null)
        {
            artist = new Artist
            {
                Name = artistName,
                Bio = $"Biography of {artistName}",
                ImageUrl = "/images/default-artist.jpg"
            };

            _context.Artists.Add(artist);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Created new artist: {artistName}");
        }

        return artist;
    }

    private async Task<Album> GetOrCreateAlbumAsync(string albumName, int artistId)
    {
        var album = await _context.Albums
            .FirstOrDefaultAsync(a => a.Title.ToLower() == albumName.ToLower() && a.ArtistId == artistId);

        if (album == null)
        {
            album = new Album
            {
                Title = albumName,
                ArtistId = artistId,
                ReleaseDate = DateTime.Now,
                CoverImageUrl = "/images/default-album.jpg"
            };

            _context.Albums.Add(album);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Created new album: {albumName}");
        }

        return album;
    }

    private async Task ProcessTrackAsync(string mp3FilePath, Album album, Artist artist)
    {
        var mp3FileName = Path.GetFileName(mp3FilePath);
        var fileName = Path.GetFileNameWithoutExtension(mp3FilePath);

        // Build audioUrl from actual filesystem path relative to music root
        var relativePath = Path.GetRelativePath(_musicPath, mp3FilePath).Replace("\\", "/");
        var audioUrl = "/music/" + relativePath;
        var existingTrack = await _context.Tracks
            .FirstOrDefaultAsync(t => t.AudioUrl != null && t.AudioUrl == audioUrl);

        if (existingTrack != null)
        {
            _logger.LogDebug($"Track already exists: {fileName}");
            return;
        }

        // Read MP3 metadata
        Track track;
        try
        {
            using (var file = TagLib.File.Create(mp3FilePath))
            {
                var tag = file.Tag;
                track = new Track
                {
                    Title = string.IsNullOrEmpty(tag.Title) ? fileName : tag.Title,
                    Duration = file.Properties.Duration,
                    AlbumId = album.Id,
                    AudioUrl = audioUrl,
                    PlayCount = 0
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"Could not read metadata for {mp3FilePath}: {ex.Message}. Using filename as title.");
            track = new Track
            {
                Title = fileName,
                Duration = TimeSpan.FromSeconds(180),
                AlbumId = album.Id,
                AudioUrl = audioUrl,
                PlayCount = 0
            };
        }

        _context.Tracks.Add(track);
        // Save first so track.Id is generated before creating TrackArtist
        await _context.SaveChangesAsync();

        // Create TrackArtist relationship (track.Id is now valid)
        var trackArtist = new TrackArtist
        {
            TrackId = track.Id,
            ArtistId = artist.Id
        };
        _context.TrackArtists.Add(trackArtist);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Created new track: {track.Title}");
    }
}
