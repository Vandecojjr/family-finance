using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseIdToCreditCardInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ExpenseId",
                table: "CreditCardInvoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "CreditCardInvoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_CreditCardInvoices_ExpenseId",
                table: "CreditCardInvoices",
                column: "ExpenseId");

            migrationBuilder.AddForeignKey(
                name: "FK_CreditCardInvoices_Expenses_ExpenseId",
                table: "CreditCardInvoices",
                column: "ExpenseId",
                principalTable: "Expenses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CreditCardInvoices_Expenses_ExpenseId",
                table: "CreditCardInvoices");

            migrationBuilder.DropIndex(
                name: "IX_CreditCardInvoices_ExpenseId",
                table: "CreditCardInvoices");

            migrationBuilder.DropColumn(
                name: "ExpenseId",
                table: "CreditCardInvoices");

            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "CreditCardInvoices");
        }
    }
}
