using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlbumsController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;

        public AlbumsController(MuseArchiveDbContext context)
        {
            _context = context;
        }

        // GET: api/Albums
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Album>>> GetAlbums([FromQuery] int limit = 50)
        {
            return await _context.Albums
                .Include(a => a.Artist)
                .Include(a => a.Tracks)
                .OrderByDescending(a => a.CreatedAt)
                .Take(Math.Min(limit, 200))
                .ToListAsync();
        }

        // GET: api/Albums/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Album>> GetAlbum(int id)
        {
            var album = await _context.Albums
                .Include(a => a.Artist)
                .Include(a => a.Tracks)
                .ThenInclude(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (album == null)
            {
                return NotFound();
            }

            return album;
        }

        // GET: api/Albums/ByArtist/5
        [HttpGet("ByArtist/{artistId}")]
        public async Task<ActionResult<IEnumerable<Album>>> GetAlbumsByArtist(int artistId)
        {
            return await _context.Albums
                .Where(a => a.ArtistId == artistId)
                .Include(a => a.Artist)
                .Include(a => a.Tracks)
                .ToListAsync();
        }

        // POST: api/Albums
        [HttpPost]
        public async Task<ActionResult<Album>> CreateAlbum(Album album)
        {
            _context.Albums.Add(album);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAlbum), new { id = album.Id }, album);
        }

        // PUT: api/Albums/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAlbum(int id, Album album)
        {
            if (id != album.Id)
            {
                return BadRequest();
            }

            album.UpdatedAt = DateTime.UtcNow;
            _context.Entry(album).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AlbumExists(id))
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

        // DELETE: api/Albums/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlbum(int id)
        {
            var album = await _context.Albums.FindAsync(id);
            if (album == null)
            {
                return NotFound();
            }

            _context.Albums.Remove(album);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AlbumExists(int id)
        {
            return _context.Albums.Any(e => e.Id == id);
        }
    }
}
