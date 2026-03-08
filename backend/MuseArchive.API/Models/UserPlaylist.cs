using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class UserPlaylist
    {
        [Key]
        public int Id { get; set; }

        // Foreign keys
        public int UserId { get; set; }
        public int PlaylistId { get; set; }

        [MaxLength(50)]
        public string? Role { get; set; } // "owner", "collaborator", "follower"

        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("PlaylistId")]
        public virtual Playlist Playlist { get; set; } = null!;
    }
}
