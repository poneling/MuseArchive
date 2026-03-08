using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MuseArchive.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFavoriteArtist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserFavoriteArtists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ArtistId = table.Column<int>(type: "int", nullable: false),
                    FollowedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavoriteArtists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFavoriteArtists_Artists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "Artists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFavoriteArtists_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserFavoriteArtists_ArtistId",
                table: "UserFavoriteArtists",
                column: "ArtistId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavoriteArtists_UserId_ArtistId",
                table: "UserFavoriteArtists",
                columns: new[] { "UserId", "ArtistId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFavoriteArtists");
        }
    }
}
