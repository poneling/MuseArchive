using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class TrackArtist
    {
        [Key]
        public int Id { get; set; }

        // Foreign keys
        public int TrackId { get; set; }
        public int ArtistId { get; set; }

        [MaxLength(50)]
        public string? Role { get; set; } // "primary", "featured", "producer", etc.

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("TrackId")]
        public virtual Track Track { get; set; } = null!;

        [ForeignKey("ArtistId")]
        public virtual Artist Artist { get; set; } = null!;
    }
}
