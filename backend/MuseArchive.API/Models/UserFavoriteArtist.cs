using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class UserFavoriteArtist
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public int ArtistId { get; set; }

        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("ArtistId")]
        public virtual Artist Artist { get; set; } = null!;
    }
}
