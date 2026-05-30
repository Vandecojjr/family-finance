using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMemberId1ShadowColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Members_MemberId1",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_MemberId1",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "MemberId1",
                table: "Expenses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MemberId1",
                table: "Expenses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_MemberId1",
                table: "Expenses",
                column: "MemberId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Members_MemberId1",
                table: "Expenses",
                column: "MemberId1",
                principalTable: "Members",
                principalColumn: "Id");
        }
    }
}
