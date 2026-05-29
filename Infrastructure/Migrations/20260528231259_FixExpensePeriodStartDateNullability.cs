using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixExpensePeriodStartDateNullability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RecurringType = table.Column<int>(type: "integer", nullable: true),
                    Frequency = table.Column<int>(type: "integer", nullable: true),
                    DueDay = table.Column<int>(type: "integer", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<bool>(type: "boolean", nullable: true),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId1 = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expenses_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Expenses_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Expenses_Members_MemberId1",
                        column: x => x.MemberId1,
                        principalTable: "Members",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ExpensePayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpensePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpensePayments_Expenses_ExpenseId",
                        column: x => x.ExpenseId,
                        principalTable: "Expenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpensePayments_ExpenseId",
                table: "ExpensePayments",
                column: "ExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_CategoryId",
                table: "Expenses",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_MemberId",
                table: "Expenses",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_MemberId1",
                table: "Expenses",
                column: "MemberId1");

            // Copy data from PlannedExpenses to Expenses
            migrationBuilder.Sql(@"
                INSERT INTO ""Expenses"" (
                    ""Id"", ""Description"", ""Amount"", ""Type"", ""Date"", 
                    ""RecurringType"", ""Frequency"", ""DueDay"", ""StartDate"", ""EndDate"", 
                    ""Status"", ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""Description"", ""Amount"", 1, ""Date"", 
                    NULL, NULL, NULL, NULL, NULL, 
                    NULL, ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""PlannedExpenses"";
            ");

            // Copy data from RecurringExpenses to Expenses
            migrationBuilder.Sql(@"
                INSERT INTO ""Expenses"" (
                    ""Id"", ""Description"", ""Amount"", ""Type"", ""Date"", 
                    ""RecurringType"", ""Frequency"", ""DueDay"", ""StartDate"", ""EndDate"", 
                    ""Status"", ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""Description"", ""Amount"", 2, NULL, 
                    ""Type"", ""Frequency"", ""DueDay"", ""StartDate"", ""EndDate"", 
                    ""Status"", ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""RecurringExpenses"";
            ");

            // Copy data from RecurringExpensePayments to ExpensePayments
            migrationBuilder.Sql(@"
                INSERT INTO ""ExpensePayments"" (
                    ""Id"", ""ExpenseId"", ""Month"", ""Year"", ""AmountPaid"", ""PaidAt"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""RecurringExpenseId"", ""Month"", ""Year"", ""AmountPaid"", ""PaidAt"", ""CreatedAt"", ""UpdatedAt""
                FROM ""RecurringExpensePayments"";
            ");

            // Drop old tables
            migrationBuilder.DropTable(
                name: "PlannedExpenses");

            migrationBuilder.DropTable(
                name: "RecurringExpensePayments");

            migrationBuilder.DropTable(
                name: "RecurringExpenses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlannedExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlannedExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlannedExpenses_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlannedExpenses_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecurringExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DueDay = table.Column<int>(type: "integer", nullable: false),
                    Frequency = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<bool>(type: "boolean", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringExpenses_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringExpenses_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecurringExpensePayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RecurringExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringExpensePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringExpensePayments_RecurringExpenses_RecurringExpense~",
                        column: x => x.RecurringExpenseId,
                        principalTable: "RecurringExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlannedExpenses_CategoryId",
                table: "PlannedExpenses",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_PlannedExpenses_MemberId",
                table: "PlannedExpenses",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringExpensePayments_RecurringExpenseId",
                table: "RecurringExpensePayments",
                column: "RecurringExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringExpenses_CategoryId",
                table: "RecurringExpenses",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringExpenses_MemberId",
                table: "RecurringExpenses",
                column: "MemberId");

            // Copy data back from Expenses to PlannedExpenses
            migrationBuilder.Sql(@"
                INSERT INTO ""PlannedExpenses"" (
                    ""Id"", ""Description"", ""Amount"", ""Date"", 
                    ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""Description"", ""Amount"", ""Date"", 
                    ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""Expenses""
                WHERE ""Type"" = 1;
            ");

            // Copy data back from Expenses to RecurringExpenses
            migrationBuilder.Sql(@"
                INSERT INTO ""RecurringExpenses"" (
                    ""Id"", ""Description"", ""Amount"", ""Type"", 
                    ""Frequency"", ""DueDay"", ""StartDate"", ""EndDate"", 
                    ""Status"", ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""Description"", ""Amount"", ""RecurringType"", 
                    ""Frequency"", ""DueDay"", ""StartDate"", ""EndDate"", 
                    ""Status"", ""MemberId"", ""CategoryId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""Expenses""
                WHERE ""Type"" = 2;
            ");

            // Copy data back from ExpensePayments to RecurringExpensePayments
            migrationBuilder.Sql(@"
                INSERT INTO ""RecurringExpensePayments"" (
                    ""Id"", ""RecurringExpenseId"", ""Month"", ""Year"", ""AmountPaid"", ""PaidAt"", ""CreatedAt"", ""UpdatedAt""
                )
                SELECT 
                    ""Id"", ""ExpenseId"", ""Month"", ""Year"", ""AmountPaid"", ""PaidAt"", ""CreatedAt"", ""UpdatedAt""
                FROM ""ExpensePayments"";
            ");

            // Drop new tables
            migrationBuilder.DropTable(
                name: "ExpensePayments");

            migrationBuilder.DropTable(
                name: "Expenses");
        }
    }
}
