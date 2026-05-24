using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class add_members : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FamilyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Members_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_MemberId",
                table: "Accounts",
                column: "MemberId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Members_FamilyId",
                table: "Members",
                column: "FamilyId");

            migrationBuilder.Sql("DELETE FROM \"AccountRole\";");
            migrationBuilder.Sql("DELETE FROM \"RefreshTokens\";");
            migrationBuilder.Sql("DELETE FROM \"Accounts\";");

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Members_MemberId",
                table: "Accounts",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Members_MemberId",
                table: "Accounts");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_MemberId",
                table: "Accounts");
        }
    }
}
