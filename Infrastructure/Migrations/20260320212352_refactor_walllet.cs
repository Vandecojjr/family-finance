using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class refactor_walllet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_Families_FamilyId",
                table: "Wallets");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_Members_OwnerId",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_FamilyId",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "FamilyId",
                table: "Wallets");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "Wallets",
                newName: "MemberId");

            migrationBuilder.RenameIndex(
                name: "IX_Wallets_OwnerId",
                table: "Wallets",
                newName: "IX_Wallets_MemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_Members_MemberId",
                table: "Wallets",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_Members_MemberId",
                table: "Wallets");

            migrationBuilder.RenameColumn(
                name: "MemberId",
                table: "Wallets",
                newName: "OwnerId");

            migrationBuilder.RenameIndex(
                name: "IX_Wallets_MemberId",
                table: "Wallets",
                newName: "IX_Wallets_OwnerId");

            migrationBuilder.AddColumn<Guid>(
                name: "FamilyId",
                table: "Wallets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_FamilyId",
                table: "Wallets",
                column: "FamilyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_Families_FamilyId",
                table: "Wallets",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_Members_OwnerId",
                table: "Wallets",
                column: "OwnerId",
                principalTable: "Members",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
