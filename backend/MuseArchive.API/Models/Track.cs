using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class Track
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? AudioUrl { get; set; }

        public TimeSpan Duration { get; set; }

        public int TrackNumber { get; set; }

        [MaxLength(100)]
        public string? Genre { get; set; }

        public int? PlayCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Foreign keys
        public int AlbumId { get; set; }

        // Navigation properties
        [ForeignKey("AlbumId")]
        public virtual Album Album { get; set; } = null!;
        public virtual ICollection<TrackArtist> TrackArtists { get; set; } = new List<TrackArtist>();
        public virtual ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();
        public virtual ICollection<UserFavoriteTrack> FavoriteTracks { get; set; } = new List<UserFavoriteTrack>();
    }
}
