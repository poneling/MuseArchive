using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using MuseArchive.API.Models;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;

        public SearchController(MuseArchiveDbContext context)
        {
            _context = context;
        }

        // GET: api/Search?q=query
        [HttpGet]
        public async Task<ActionResult<SearchResult>> Search([FromQuery] string q, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query is required");
            }

            var query = q.ToLower().Trim();

            var artists = await _context.Artists
                .Where(a => a.Name.ToLower().Contains(query) || 
                             (a.Bio != null && a.Bio.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            var albums = await _context.Albums
                .Include(a => a.Artist)
                .Where(a => a.Title.ToLower().Contains(query) ||
                             (a.Artist != null && a.Artist.Name.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            var tracks = await _context.Tracks
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .Where(t => t.Title.ToLower().Contains(query) ||
                             (t.Album != null && t.Album.Title.ToLower().Contains(query)) ||
                             t.TrackArtists.Any(ta => ta.Artist.Name.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            var playlists = await _context.Playlists
                .Include(p => p.CreatedByUser)
                .Where(p => p.Name.ToLower().Contains(query) ||
                             (p.Description != null && p.Description.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            var result = new SearchResult
            {
                Artists = artists,
                Albums = albums,
                Tracks = tracks,
                Playlists = playlists,
                TotalResults = artists.Count + albums.Count + tracks.Count + playlists.Count
            };

            return Ok(result);
        }

        // GET: api/Search/Artists?q=query
        [HttpGet("Artists")]
        public async Task<ActionResult<IEnumerable<Artist>>> SearchArtists([FromQuery] string q, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query is required");
            }

            var query = q.ToLower().Trim();

            var artists = await _context.Artists
                .Where(a => a.Name.ToLower().Contains(query) || 
                             (a.Bio != null && a.Bio.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            return Ok(artists);
        }

        // GET: api/Search/Albums?q=query
        [HttpGet("Albums")]
        public async Task<ActionResult<IEnumerable<Album>>> SearchAlbums([FromQuery] string q, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query is required");
            }

            var query = q.ToLower().Trim();

            var albums = await _context.Albums
                .Include(a => a.Artist)
                .Where(a => a.Title.ToLower().Contains(query) ||
                             (a.Artist != null && a.Artist.Name.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            return Ok(albums);
        }

        // GET: api/Search/Tracks?q=query
        [HttpGet("Tracks")]
        public async Task<ActionResult<IEnumerable<Track>>> SearchTracks([FromQuery] string q, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query is required");
            }

            var query = q.ToLower().Trim();

            var tracks = await _context.Tracks
                .Include(t => t.Album)
                .ThenInclude(a => a.Artist)
                .Include(t => t.TrackArtists)
                .ThenInclude(ta => ta.Artist)
                .Where(t => t.Title.ToLower().Contains(query) ||
                             (t.Album != null && t.Album.Title.ToLower().Contains(query)) ||
                             t.TrackArtists.Any(ta => ta.Artist.Name.ToLower().Contains(query)))
                .Take(limit)
                .ToListAsync();

            return Ok(tracks);
        }

        // GET: api/Search/Playlists?q=query
        [HttpGet("Playlists")]
        public async Task<ActionResult<IEnumerable<Playlist>>> SearchPlaylists([FromQuery] string q, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest("Search query is required");
            }

            var query = q.ToLower().Trim();

            var playlists = await _context.Playlists
                .Include(p => p.CreatedByUser)
                .Where(p => p.IsPublic && 
                            (p.Name.ToLower().Contains(query) ||
                             (p.Description != null && p.Description.ToLower().Contains(query))))
                .Take(limit)
                .ToListAsync();

            return Ok(playlists);
        }
    }

    public class SearchResult
    {
        public List<Artist> Artists { get; set; } = new();
        public List<Album> Albums { get; set; } = new();
        public List<Track> Tracks { get; set; } = new();
        public List<Playlist> Playlists { get; set; } = new();
        public int TotalResults { get; set; }
    }
}
