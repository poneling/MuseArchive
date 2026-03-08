using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuseArchive.API.Models
{
    public class PlaylistTrack
    {
        [Key]
        public int Id { get; set; }

        // Foreign keys
        public int PlaylistId { get; set; }
        public int TrackId { get; set; }

        public int Position { get; set; } // Order in playlist

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        public int? AddedByUserId { get; set; } // For collaborative playlists

        // Navigation properties
        [ForeignKey("PlaylistId")]
        public virtual Playlist Playlist { get; set; } = null!;

        [ForeignKey("TrackId")]
        public virtual Track Track { get; set; } = null!;

        [ForeignKey("AddedByUserId")]
        public virtual User? AddedByUser { get; set; }
    }
}
