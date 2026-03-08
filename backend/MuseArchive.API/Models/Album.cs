using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class Album
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? CoverImageUrl { get; set; }

        public DateTime ReleaseDate { get; set; }

        [MaxLength(100)]
        public string? Genre { get; set; }

        [MaxLength(50)]
        public string? RecordLabel { get; set; }

        public int? TotalTracks { get; set; }

        public TimeSpan? Duration { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Foreign keys
        public int ArtistId { get; set; }

        // Navigation properties
        [ForeignKey("ArtistId")]
        public virtual Artist Artist { get; set; } = null!;
        public virtual ICollection<Track> Tracks { get; set; } = new List<Track>();
    }
}
