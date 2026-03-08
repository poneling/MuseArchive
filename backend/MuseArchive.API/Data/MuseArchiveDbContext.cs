using Microsoft.EntityFrameworkCore;
using MuseArchive.API.Models;

namespace MuseArchive.API.Data
{
    public class MuseArchiveDbContext : DbContext
    {
        public MuseArchiveDbContext(DbContextOptions<MuseArchiveDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Artist> Artists { get; set; }
        public DbSet<Album> Albums { get; set; }
        public DbSet<Track> Tracks { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<TrackArtist> TrackArtists { get; set; }
        public DbSet<PlaylistTrack> PlaylistTracks { get; set; }
        public DbSet<UserPlaylist> UserPlaylists { get; set; }
        public DbSet<UserFavoriteTrack> UserFavoriteTracks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configurations
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Artist configurations
            modelBuilder.Entity<Artist>(entity =>
            {
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Album configurations
            modelBuilder.Entity<Album>(entity =>
            {
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(a => a.Artist)
                      .WithMany(ar => ar.Albums)
                      .HasForeignKey(a => a.ArtistId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Track configurations
            modelBuilder.Entity<Track>(entity =>
            {
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(t => t.Album)
                      .WithMany(a => a.Tracks)
                      .HasForeignKey(t => t.AlbumId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // TrackArtist many-to-many relationship
            modelBuilder.Entity<TrackArtist>(entity =>
            {
                entity.HasOne(ta => ta.Track)
                      .WithMany(t => t.TrackArtists)
                      .HasForeignKey(ta => ta.TrackId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ta => ta.Artist)
                      .WithMany(a => a.TrackArtists)
                      .HasForeignKey(ta => ta.ArtistId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Playlist configurations
            modelBuilder.Entity<Playlist>(entity =>
            {
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(p => p.CreatedByUser)
                      .WithMany(u => u.Playlists)
                      .HasForeignKey(p => p.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // PlaylistTrack many-to-many relationship
            modelBuilder.Entity<PlaylistTrack>(entity =>
            {
                entity.HasOne(pt => pt.Playlist)
                      .WithMany(p => p.PlaylistTracks)
                      .HasForeignKey(pt => pt.PlaylistId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(pt => pt.Track)
                      .WithMany(t => t.PlaylistTracks)
                      .HasForeignKey(pt => pt.TrackId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(pt => pt.AddedByUser)
                      .WithMany()
                      .HasForeignKey(pt => pt.AddedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.Property(e => e.AddedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // UserPlaylist many-to-many relationship
            modelBuilder.Entity<UserPlaylist>(entity =>
            {
                entity.HasOne(up => up.User)
                      .WithMany(u => u.UserPlaylists)
                      .HasForeignKey(up => up.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(up => up.Playlist)
                      .WithMany(p => p.UserPlaylists)
                      .HasForeignKey(up => up.PlaylistId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.FollowedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // UserFavoriteTrack many-to-many relationship
            modelBuilder.Entity<UserFavoriteTrack>(entity =>
            {
                entity.HasOne(uf => uf.User)
                      .WithMany(u => u.FavoriteTracks)
                      .HasForeignKey(uf => uf.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(uf => uf.Track)
                      .WithMany(t => t.FavoriteTracks)
                      .HasForeignKey(uf => uf.TrackId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.FavoritedAt).HasDefaultValueSql("GETUTCDATE()");
            });
        }
    }
}
