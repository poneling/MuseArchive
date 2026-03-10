using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;

namespace MuseArchive.API.Services;

public class DuplicateCleanupService
{
    private readonly MuseArchiveDbContext _context;
    private readonly ILogger<DuplicateCleanupService> _logger;

    public DuplicateCleanupService(MuseArchiveDbContext context, ILogger<DuplicateCleanupService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CleanDuplicatesAsync()
    {
        _logger.LogInformation("Starting duplicate cleanup...");
        await CleanDuplicateArtistsAsync();
        await CleanDuplicateAlbumsAsync();
        _logger.LogInformation("Duplicate cleanup completed.");
    }

    // ─── Merge duplicate artists (same name, case-insensitive + trimmed) ───────

    private async Task CleanDuplicateArtistsAsync()
    {
        // Use projection to avoid querying columns that may not exist yet (e.g. Genre before migration)
        var allArtists = await _context.Artists
            .Select(a => new { a.Id, a.Name })
            .ToListAsync();

        var groups = allArtists
            .GroupBy(a => a.Name.Trim().ToLowerInvariant())
            .Where(g => g.Count() > 1)
            .ToList();

        _logger.LogInformation("Found {Count} duplicate artist group(s)", groups.Count);

        foreach (var group in groups)
        {
            var keep      = group.OrderBy(a => a.Id).First();
            var duplicates = group.OrderBy(a => a.Id).Skip(1).ToList();

            foreach (var dup in duplicates)
            {
                // Reassign albums
                var albums = await _context.Albums.Where(a => a.ArtistId == dup.Id).ToListAsync();
                foreach (var album in albums) album.ArtistId = keep.Id;

                // Reassign track-artist links (skip if already linked)
                var taLinks = await _context.TrackArtists.Where(ta => ta.ArtistId == dup.Id).ToListAsync();
                foreach (var ta in taLinks)
                {
                    bool alreadyLinked = await _context.TrackArtists
                        .AnyAsync(x => x.ArtistId == keep.Id && x.TrackId == ta.TrackId);
                    if (alreadyLinked) _context.TrackArtists.Remove(ta);
                    else               ta.ArtistId = keep.Id;
                }

                // Reassign user-favorite-artist links
                var faLinks = await _context.UserFavoriteArtists.Where(ua => ua.ArtistId == dup.Id).ToListAsync();
                foreach (var fa in faLinks)
                {
                    bool alreadyLinked = await _context.UserFavoriteArtists
                        .AnyAsync(x => x.ArtistId == keep.Id && x.UserId == fa.UserId);
                    if (alreadyLinked) _context.UserFavoriteArtists.Remove(fa);
                    else               fa.ArtistId = keep.Id;
                }

                await _context.SaveChangesAsync();

                // Delete duplicate via raw SQL to avoid loading full entity with potentially missing columns
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Artists WHERE Id = {0}", dup.Id);

                _logger.LogInformation("Merged artist '{Dup}' (Id={DId}) → Id={KId}", dup.Name, dup.Id, keep.Id);
            }
        }
    }

    // ─── Merge duplicate albums (same title+artistId, case-insensitive) ────────

    private async Task CleanDuplicateAlbumsAsync()
    {
        // Use projection to avoid querying columns that may not exist yet
        var allAlbums = await _context.Albums
            .Select(a => new { a.Id, a.Title, a.ArtistId, a.CoverImageUrl })
            .ToListAsync();

        var groups = allAlbums
            .GroupBy(a => $"{a.ArtistId}::{a.Title.Trim().ToLowerInvariant()}")
            .Where(g => g.Count() > 1)
            .ToList();

        _logger.LogInformation("Found {Count} duplicate album group(s)", groups.Count);

        foreach (var group in groups)
        {
            var keep       = group.OrderBy(a => a.Id).First();
            var duplicates = group.OrderBy(a => a.Id).Skip(1).ToList();

            // Inherit cover from a duplicate if the kept record has none
            if (keep.CoverImageUrl == null)
            {
                var coverUrl = duplicates.FirstOrDefault(d => d.CoverImageUrl != null)?.CoverImageUrl;
                if (coverUrl != null)
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE Albums SET CoverImageUrl = {0} WHERE Id = {1}", coverUrl, keep.Id);
            }

            foreach (var dup in duplicates)
            {
                var tracks = await _context.Tracks.Where(t => t.AlbumId == dup.Id).ToListAsync();
                foreach (var track in tracks) track.AlbumId = keep.Id;

                await _context.SaveChangesAsync();

                // Delete via raw SQL to avoid full entity load
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Albums WHERE Id = {0}", dup.Id);

                _logger.LogInformation("Merged album '{Dup}' (Id={DId}) → Id={KId}", dup.Title, dup.Id, keep.Id);
            }
        }
    }
}
