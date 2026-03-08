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

    /// <summary>
    /// Returns bio for the artist. Uses DB cache; fetches from Wikipedia if empty.
    /// </summary>
    public async Task<string?> GetOrFetchBioAsync(int artistId)
    {
        var artist = await _context.Artists.FindAsync(artistId);
        if (artist == null) return null;

        // Return cached bio if it already looks like real content (not the default placeholder)
        if (!string.IsNullOrWhiteSpace(artist.Bio)
            && !artist.Bio.StartsWith("Biography of ", StringComparison.OrdinalIgnoreCase))
        {
            return artist.Bio;
        }

        // Fetch from Wikipedia
        var bio = await FetchWikipediaSummaryAsync(artist.Name);
        if (!string.IsNullOrWhiteSpace(bio))
        {
            artist.Bio = bio;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Fetched Wikipedia bio for {Artist}", artist.Name);
        }

        return bio ?? artist.Bio;
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
