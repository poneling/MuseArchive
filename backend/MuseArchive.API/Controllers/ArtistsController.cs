using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;
using MuseArchive.API.Services;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArtistsController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;
        private readonly ArtistWikiService _wiki;

        public ArtistsController(MuseArchiveDbContext context, ArtistWikiService wiki)
        {
            _context = context;
            _wiki    = wiki;
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

        // GET: api/Artists/{id}/wiki
        [HttpGet("{id}/wiki")]
        public async Task<IActionResult> GetArtistWiki(int id)
        {
            var bio = await _wiki.GetOrFetchBioAsync(id);
            if (bio == null) return NotFound(new { message = "Artist not found." });
            return Ok(new { bio });
        }

        // GET: api/Artists/Followed?userId=5
        [HttpGet("Followed")]
        public async Task<IActionResult> GetFollowedArtists([FromQuery] int userId)
        {
            var artists = await _context.UserFavoriteArtists
                .Where(ua => ua.UserId == userId)
                .Include(ua => ua.Artist)
                .Select(ua => ua.Artist)
                .ToListAsync();
            return Ok(artists);
        }

        // GET: api/Artists/{id}/IsFollowed?userId=5
        [HttpGet("{id}/IsFollowed")]
        public async Task<IActionResult> IsFollowed(int id, [FromQuery] int userId)
        {
            var followed = await _context.UserFavoriteArtists
                .AnyAsync(ua => ua.UserId == userId && ua.ArtistId == id);
            return Ok(new { followed });
        }

        // POST: api/Artists/{id}/Follow
        [HttpPost("{id}/Follow")]
        public async Task<IActionResult> Follow(int id, [FromBody] UserActionRequest req)
        {
            if (!await _context.Artists.AnyAsync(a => a.Id == id))
                return NotFound(new { message = "Artist not found." });

            if (await _context.UserFavoriteArtists.AnyAsync(ua => ua.UserId == req.UserId && ua.ArtistId == id))
                return Conflict(new { message = "Already following." });

            _context.UserFavoriteArtists.Add(new UserFavoriteArtist { UserId = req.UserId, ArtistId = id });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Followed." });
        }

        // DELETE: api/Artists/{id}/Unfollow?userId=5
        [HttpDelete("{id}/Unfollow")]
        public async Task<IActionResult> Unfollow(int id, [FromQuery] int userId)
        {
            var entry = await _context.UserFavoriteArtists
                .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.ArtistId == id);
            if (entry == null) return NotFound();
            _context.UserFavoriteArtists.Remove(entry);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ArtistExists(int id)
        {
            return _context.Artists.Any(e => e.Id == id);
        }
    }

    public class UserActionRequest
    {
        public int UserId { get; set; }
    }
}
