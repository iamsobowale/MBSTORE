using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MBSite.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderAdminViewedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AdminViewedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminViewedAt",
                table: "orders");
        }
    }
}
