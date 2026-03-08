using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TracksController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;

        public TracksController(MuseArchiveDbContext context)
        {
            _context = context;
        }

        // GET: api/Tracks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Track>>> GetTracks()
        {
            return await _context.Tracks
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .ToListAsync();
        }

        // GET: api/Tracks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Track>> GetTrack(int id)
        {
            var track = await _context.Tracks
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (track == null)
            {
                return NotFound();
            }

            return track;
        }

        // GET: api/Tracks/ByAlbum/5
        [HttpGet("ByAlbum/{albumId}")]
        public async Task<ActionResult<IEnumerable<Track>>> GetTracksByAlbum(int albumId)
        {
            return await _context.Tracks
                .Where(t => t.AlbumId == albumId)
                .Include(t => t.Album)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .OrderBy(t => t.TrackNumber)
                .ToListAsync();
        }

        // GET: api/Tracks/ByArtist/5
        [HttpGet("ByArtist/{artistId}")]
        public async Task<ActionResult<IEnumerable<Track>>> GetTracksByArtist(int artistId)
        {
            return await _context.Tracks
                .Where(t => t.TrackArtists.Any(ta => ta.ArtistId == artistId))
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .ToListAsync();
        }

        // GET: api/Tracks/ByGenre/rock
        [HttpGet("ByGenre/{genre}")]
        public async Task<ActionResult<IEnumerable<Track>>> GetTracksByGenre(string genre)
        {
            return await _context.Tracks
                .Where(t => t.Genre != null && t.Genre.ToLower().Contains(genre.ToLower()))
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .OrderBy(t => t.Title)
                .ToListAsync();
        }

        // POST: api/Tracks
        [HttpPost]
        public async Task<ActionResult<Track>> CreateTrack(Track track)
        {
            _context.Tracks.Add(track);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrack), new { id = track.Id }, track);
        }

        // PUT: api/Tracks/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrack(int id, Track track)
        {
            if (id != track.Id)
            {
                return BadRequest();
            }

            track.UpdatedAt = DateTime.UtcNow;
            _context.Entry(track).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TrackExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Tracks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrack(int id)
        {
            var track = await _context.Tracks.FindAsync(id);
            if (track == null)
            {
                return NotFound();
            }

            _context.Tracks.Remove(track);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Tracks/5/Play
        [HttpPost("{id}/Play")]
        public async Task<IActionResult> IncrementPlayCount(int id)
        {
            var track = await _context.Tracks.FindAsync(id);
            if (track == null)
            {
                return NotFound();
            }

            track.PlayCount = (track.PlayCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TrackExists(int id)
        {
            return _context.Tracks.Any(e => e.Id == id);
        }
    }
}
