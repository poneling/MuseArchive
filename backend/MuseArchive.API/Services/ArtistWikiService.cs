using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Data;
using System.Text.Json;
using System.Web;

namespace MuseArchive.API.Services;

public class ArtistWikiService
{
    private readonly MuseArchiveDbContext _context;
    private readonly HttpClient _http;
    private readonly ILogger<ArtistWikiService> _logger;

    private const string WikiApiBase = "https://en.wikipedia.org/api/rest_v1/page/summary/";

    public ArtistWikiService(MuseArchiveDbContext context, IHttpClientFactory httpFactory, ILogger<ArtistWikiService> logger)
    {
        _context = context;
        _http    = httpFactory.CreateClient();
        _logger  = logger;
    }

    // Common genre keywords to detect from bio text
    private static readonly string[] GenreKeywords =
    {
        "hip hop", "hip-hop", "rap", "trap",
        "pop", "synth-pop", "electropop",
        "rock", "alternative rock", "indie rock", "hard rock", "punk rock", "post-punk",
        "electronic", "electronica", "electro", "techno", "house", "ambient", "synth",
        "jazz", "blues", "soul", "r&b", "rnb", "rhythm and blues",
        "metal", "heavy metal", "death metal",
        "classical", "orchestral",
        "country", "folk", "bluegrass",
        "reggae", "dancehall", "latin", "bossa nova",
        "indie", "alternative", "dream pop", "shoegaze",
        "industrial", "noise", "experimental",
    };

    /// <summary>
    /// Returns bio for the artist. Uses DB cache; fetches from Wikipedia if empty.
    /// Also detects and stores genre from bio text.
    /// </summary>
    public async Task<string?> GetOrFetchBioAsync(int artistId)
    {
        var artist = await _context.Artists.FindAsync(artistId);
        if (artist == null) return null;

        var hasBio = !string.IsNullOrWhiteSpace(artist.Bio)
                     && !artist.Bio.StartsWith("Biography of ", StringComparison.OrdinalIgnoreCase);

        if (hasBio)
        {
            // Try to detect genre from existing bio if not set
            if (string.IsNullOrWhiteSpace(artist.Genre))
            {
                var detectedGenre = DetectGenreFromText(artist.Bio!);
                if (detectedGenre != null)
                {
                    artist.Genre = detectedGenre;
                    await _context.SaveChangesAsync();
                }
            }
            return artist.Bio;
        }

        // Fetch from Wikipedia
        var bio = await FetchWikipediaSummaryAsync(artist.Name);
        if (!string.IsNullOrWhiteSpace(bio))
        {
            artist.Bio = bio;
            // Detect genre from fetched bio
            var detectedGenre = DetectGenreFromText(bio);
            if (detectedGenre != null && string.IsNullOrWhiteSpace(artist.Genre))
                artist.Genre = detectedGenre;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Fetched Wikipedia bio for {Artist}, genre: {Genre}", artist.Name, artist.Genre);
        }

        return bio ?? artist.Bio;
    }

    /// <summary>
    /// Detects primary genre from free-form text (bio, description).
    /// Returns a normalized genre name or null if nothing found.
    /// </summary>
    public static string? DetectGenreFromText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var lower = text.ToLowerInvariant();

        foreach (var kw in GenreKeywords)
        {
            if (lower.Contains(kw))
            {
                // Map keywords to canonical genre names shown in Search.tsx
                return kw switch
                {
                    "hip hop" or "hip-hop" or "rap" or "trap" => "Hip Hop",
                    "pop" or "electropop" or "synth-pop"       => "Pop",
                    "rock" or "alternative rock" or "indie rock"
                        or "hard rock" or "punk rock" or "post-punk" => "Rock",
                    "jazz"                                     => "Jazz",
                    "electronic" or "electronica" or "electro"
                        or "techno" or "house" or "ambient"
                        or "synth"                             => "Electronic",
                    "r&b" or "rnb" or "rhythm and blues"
                        or "soul"                              => "R&B",
                    "classical" or "orchestral"                => "Classical",
                    "country" or "folk" or "bluegrass"         => "Country",
                    _                                          => null,
                };
            }
        }
        return null;
    }

    private async Task<string?> FetchWikipediaSummaryAsync(string artistName)
    {
        try
        {
            var encoded = HttpUtility.UrlEncode(artistName.Replace(" ", "_"));
            var url = WikiApiBase + encoded;

            _http.DefaultRequestHeaders.UserAgent.ParseAdd("MuseArchive/1.0 (music-library-app)");
            var response = await _http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Wikipedia returned {Status} for {Artist}", response.StatusCode, artistName);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            // Prefer "extract" (plain text summary)
            if (doc.RootElement.TryGetProperty("extract", out var extract))
            {
                var text = extract.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                    return text.Length > 1000 ? text[..1000].Trim() + "…" : text;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Wikipedia fetch error for {Artist}: {Msg}", artistName, ex.Message);
        }
        return null;
    }
}
