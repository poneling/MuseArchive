using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;
using System.Security.Claims;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaylistsController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;

        public PlaylistsController(MuseArchiveDbContext context)
        {
            _context = context;
        }

        // GET: api/Playlists
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Playlist>>> GetPlaylists()
        {
            return await _context.Playlists
                .Include(p => p.CreatedByUser)
                .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Track)
                .ThenInclude(t => t.Album)
                .ThenInclude(a => a.Artist)
                .ToListAsync();
        }

        // GET: api/Playlists/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Playlist>> GetPlaylist(int id)
        {
            var playlist = await _context.Playlists
                .Include(p => p.CreatedByUser)
                .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Track)
                .ThenInclude(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Track)
                .ThenInclude(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (playlist == null)
            {
                return NotFound();
            }

            return playlist;
        }

        // GET: api/Playlists/ByUser/5
        [HttpGet("ByUser/{userId}")]
        public async Task<ActionResult<IEnumerable<Playlist>>> GetPlaylistsByUser(int userId)
        {
            return await _context.Playlists
                .Where(p => p.CreatedByUserId == userId)
                .Include(p => p.CreatedByUser)
                .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Track)
                .ToListAsync();
        }

        // POST: api/Playlists
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Playlist>> CreatePlaylist([FromBody] CreatePlaylistDto dto)
        {
            // Prefer JWT-derived userId; fall back to body value for unauthenticated dev usage
            var idClaim  = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId   = int.TryParse(idClaim, out var uid) ? uid : dto.CreatedByUserId;

            if (userId == 0)
                return Unauthorized(new { message = "User not identified." });

            var playlist = new Playlist
            {
                Name              = dto.Name?.Trim() ?? "New Playlist",
                Description       = dto.Description,
                IsPublic          = dto.IsPublic ?? false,
                CreatedByUserId   = userId,
            };

            _context.Playlists.Add(playlist);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPlaylist), new { id = playlist.Id }, playlist);
        }

        // PUT: api/Playlists/5
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlaylist(int id, [FromBody] UpdatePlaylistDto dto)
        {
            var playlist = await _context.Playlists.FindAsync(id);
            if (playlist == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name))
                playlist.Name = dto.Name.Trim();
            if (dto.Description != null)
                playlist.Description = dto.Description;

            playlist.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Playlists/5
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlaylist(int id)
        {
            var playlist = await _context.Playlists.FindAsync(id);
            if (playlist == null)
            {
                return NotFound();
            }

            _context.Playlists.Remove(playlist);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Playlists/5/AddTrack
        [Authorize]
        [HttpPost("{playlistId}/AddTrack")]
        public async Task<ActionResult<PlaylistTrack>> AddTrackToPlaylist(int playlistId, [FromBody] PlaylistTrackRequest request)
        {
            var playlist = await _context.Playlists.FindAsync(playlistId);
            if (playlist == null)
            {
                return NotFound("Playlist not found");
            }

            var track = await _context.Tracks.FindAsync(request.TrackId);
            if (track == null)
            {
                return NotFound("Track not found");
            }

            // Check if track already exists in playlist
            var existingTrack = await _context.PlaylistTracks
                .FirstOrDefaultAsync(pt => pt.PlaylistId == playlistId && pt.TrackId == request.TrackId);

            if (existingTrack != null)
            {
                return BadRequest("Track already exists in playlist");
            }

            // Get the next position
            var maxPosition = await _context.PlaylistTracks
                .Where(pt => pt.PlaylistId == playlistId)
                .MaxAsync(pt => (int?)pt.Position) ?? 0;

            var playlistTrack = new PlaylistTrack
            {
                PlaylistId = playlistId,
                TrackId = request.TrackId,
                Position = maxPosition + 1,
                AddedByUserId = request.AddedByUserId
            };

            _context.PlaylistTracks.Add(playlistTrack);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPlaylist), new { id = playlistId }, playlistTrack);
        }

        // DELETE: api/Playlists/5/RemoveTrack/6
        [Authorize]
        [HttpDelete("{playlistId}/RemoveTrack/{trackId}")]
        public async Task<IActionResult> RemoveTrackFromPlaylist(int playlistId, int trackId)
        {
            var playlistTrack = await _context.PlaylistTracks
                .FirstOrDefaultAsync(pt => pt.PlaylistId == playlistId && pt.TrackId == trackId);

            if (playlistTrack == null)
            {
                return NotFound();
            }

            _context.PlaylistTracks.Remove(playlistTrack);
            
            // Update positions of remaining tracks
            var remainingTracks = await _context.PlaylistTracks
                .Where(pt => pt.PlaylistId == playlistId && pt.Position > playlistTrack.Position)
                .ToListAsync();

            foreach (var track in remainingTracks)
            {
                track.Position--;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PlaylistExists(int id)
        {
            return _context.Playlists.Any(e => e.Id == id);
        }
    }

    public class PlaylistTrackRequest
    {
        public int TrackId { get; set; }
        public int? AddedByUserId { get; set; }
    }

    public class CreatePlaylistDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsPublic { get; set; }
        public int CreatedByUserId { get; set; }
    }

    public class UpdatePlaylistDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}
