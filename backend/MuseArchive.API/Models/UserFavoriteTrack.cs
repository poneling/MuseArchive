using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class UserFavoriteTrack
    {
        [Key]
        public int Id { get; set; }

        // Foreign keys
        public int UserId { get; set; }
        public int TrackId { get; set; }

        public DateTime FavoritedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("TrackId")]
        public virtual Track Track { get; set; } = null!;
    }
}
