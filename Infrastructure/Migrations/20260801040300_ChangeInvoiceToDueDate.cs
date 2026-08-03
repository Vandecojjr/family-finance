using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeInvoiceToDueDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Month",
                table: "CreditCardInvoices");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "CreditCardInvoices");

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "CreditCardInvoices",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "CreditCardInvoices");

            migrationBuilder.AddColumn<int>(
                name: "Month",
                table: "CreditCardInvoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "CreditCardInvoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
