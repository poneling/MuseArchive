using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MuseArchive.API.Migrations
{
    /// <inheritdoc />
    public partial class AddArtistGenreAndUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Genre",
                table: "Artists",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Artists_Name",
                table: "Artists",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Albums_Title_ArtistId",
                table: "Albums",
                columns: new[] { "Title", "ArtistId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Artists_Name",
                table: "Artists");

            migrationBuilder.DropIndex(
                name: "IX_Albums_Title_ArtistId",
                table: "Albums");

            migrationBuilder.DropColumn(
                name: "Genre",
                table: "Artists");
        }
    }
}
