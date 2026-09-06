using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MBSite.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSizeGuide : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SizeGuide",
                table: "products",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SizeGuide",
                table: "products");
        }
    }
}
