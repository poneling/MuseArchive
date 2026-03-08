using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArtistsController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;

        public ArtistsController(MuseArchiveDbContext context)
        {
            _context = context;
        }

        // GET: api/Artists
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Artist>>> GetArtists()
        {
            return await _context.Artists
                .Include(a => a.Albums)
                .ToListAsync();
        }

        // GET: api/Artists/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Artist>> GetArtist(int id)
        {
            var artist = await _context.Artists
                .Include(a => a.Albums)
                .ThenInclude(al => al.Tracks)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (artist == null)
            {
                return NotFound();
            }

            return artist;
        }

        // POST: api/Artists
        [HttpPost]
        public async Task<ActionResult<Artist>> CreateArtist(Artist artist)
        {
            _context.Artists.Add(artist);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetArtist), new { id = artist.Id }, artist);
        }

        // PUT: api/Artists/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArtist(int id, Artist artist)
        {
            if (id != artist.Id)
            {
                return BadRequest();
            }

            artist.UpdatedAt = DateTime.UtcNow;
            _context.Entry(artist).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ArtistExists(id))
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

        // DELETE: api/Artists/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArtist(int id)
        {
            var artist = await _context.Artists.FindAsync(id);
            if (artist == null)
            {
                return NotFound();
            }

            _context.Artists.Remove(artist);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ArtistExists(int id)
        {
            return _context.Artists.Any(e => e.Id == id);
        }
    }
}
