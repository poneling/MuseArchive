using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MuseArchive.API.Data;
using MuseArchive.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MuseArchive.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MuseArchiveDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(MuseArchiveDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Username, email, and password are required." });

            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == req.Username.ToLower()))
                return Conflict(new { message = "Username already taken." });

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower()))
                return Conflict(new { message = "Email already registered." });

            var user = new User
            {
                Username     = req.Username.Trim(),
                Email        = req.Email.Trim().ToLower(),
                PasswordHash = HashPassword(req.Password),
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful.", token = GenerateToken(user), user = MapUser(user) });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UsernameOrEmail) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Credentials required." });

            var needle = req.UsernameOrEmail.Trim().ToLower();
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == needle || u.Email.ToLower() == needle);

            if (user == null || !VerifyPassword(req.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid credentials." });

            return Ok(new { token = GenerateToken(user), user = MapUser(user) });
        }

        // GET: api/auth/me  (requires Authorization header)
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (idClaim == null) return Unauthorized();

            var user = await _context.Users.FindAsync(int.Parse(idClaim));
            if (user == null) return NotFound();

            return Ok(MapUser(user));
        }

        // GET: api/auth/favorites  — returns backend-stored favorites for the logged-in user
        [HttpGet("favorites")]
        public async Task<IActionResult> GetFavorites()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (idClaim == null) return Unauthorized();
            var userId = int.Parse(idClaim);

            var favorites = await _context.UserFavoriteTracks
                .Where(uf => uf.UserId == userId)
                .Include(uf => uf.Track).ThenInclude(t => t.Album).ThenInclude(a => a.Artist)
                .Select(uf => uf.Track)
                .ToListAsync();

            return Ok(favorites);
        }

        // POST: api/auth/favorites/{trackId}
        [HttpPost("favorites/{trackId}")]
        public async Task<IActionResult> AddFavorite(int trackId)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (idClaim == null) return Unauthorized();
            var userId = int.Parse(idClaim);

            if (!await _context.Tracks.AnyAsync(t => t.Id == trackId))
                return NotFound(new { message = "Track not found." });

            if (await _context.UserFavoriteTracks.AnyAsync(uf => uf.UserId == userId && uf.TrackId == trackId))
                return Conflict(new { message = "Already a favorite." });

            _context.UserFavoriteTracks.Add(new UserFavoriteTrack { UserId = userId, TrackId = trackId });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Added to favorites." });
        }

        // DELETE: api/auth/favorites/{trackId}
        [HttpDelete("favorites/{trackId}")]
        public async Task<IActionResult> RemoveFavorite(int trackId)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (idClaim == null) return Unauthorized();
            var userId = int.Parse(idClaim);

            var fav = await _context.UserFavoriteTracks
                .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.TrackId == trackId);
            if (fav == null) return NotFound();

            _context.UserFavoriteTracks.Remove(fav);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private string GenerateToken(User user)
        {
            var secret = _config["Jwt:Secret"] ?? "MuseArchiveDefaultSecretKey_ChangeInProduction_32chars";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
            };

            var token = new JwtSecurityToken(
                issuer:   "MuseArchive",
                audience: "MuseArchive",
                claims:   claims,
                expires:  DateTime.UtcNow.AddDays(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(16);
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(32);
            return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
        }

        private static bool VerifyPassword(string password, string stored)
        {
            var parts = stored.Split(':');
            if (parts.Length != 2) return false;
            var salt = Convert.FromBase64String(parts[0]);
            var expectedHash = Convert.FromBase64String(parts[1]);
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(32);
            return CryptographicOperations.FixedTimeEquals(hash, expectedHash);
        }

        private static object MapUser(User u) => new
        {
            u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.ProfileImageUrl, u.CreatedAt
        };
    }

    public record RegisterRequest(string Username, string Email, string Password);
    public record LoginRequest(string UsernameOrEmail, string Password);
}
