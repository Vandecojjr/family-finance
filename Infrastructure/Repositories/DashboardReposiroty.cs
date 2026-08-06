using System.Data;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Dapper;
using Infrastructure.Queries.Expanses.Dashboard;

using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Domain.Enums;
using Domain.Entities.Expenses.ValueObjects;

namespace Infrastructure.Repositories;

public sealed class DashboardReposiroty(IDbConnection connection) : IDashboardRepository
{
    public async Task<GetInitialDashBoardDto> GetInitialDashBoard(Guid memberId, CancellationToken cancellationToken = default)
    {
        const string familyIdSql = "SELECT \"FamilyId\" FROM \"Members\" WHERE \"Id\" = @MemberId";
        var familyId = await connection.QueryFirstOrDefaultAsync<Guid?>(familyIdSql, new { MemberId = memberId });

        if (familyId == null)
        {
            throw new InvalidOperationException($"Membro com ID '{memberId}' não foi encontrado.");
        }

        var query = DashboardQuerySql.GetDashboard(familyId.Value);

        using var multi = await connection.QueryMultipleAsync(
            query.Sql,
            new { FamilyId = familyId.Value }
        );

        var general = await multi.ReadFirstOrDefaultAsync<General>() 
                      ?? new General(0, 0, 0, 0, 0, 0, 0, 0);
        var projectedIncomes = (await multi.ReadAsync<CategorySummaryDto>()).ToList();
        var projectedExpenses = (await multi.ReadAsync<CategorySummaryDto>()).ToList();

        return new GetInitialDashBoardDto(general, projectedIncomes, projectedExpenses);
    }

    public async Task<List<CalendarIndicatorDto>> GetCalendarIndicatorsAsync(Guid familyId, int year, int month, CancellationToken cancellationToken = default)
    {
        var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var expensesSql = @"
            SELECT 
                re.""Id"",
                re.""Description"" as ""Title"",
                re.""Amount"",
                re.""Type"",
                re.""Date"",
                re.""DueDay"",
                CASE WHEN p.""Id"" IS NOT NULL THEN true ELSE false END AS ""IsPaid""
            FROM ""Expenses"" re
            INNER JOIN ""Members"" m ON re.""MemberId"" = m.""Id""
            LEFT JOIN ""ExpensePayments"" p ON re.""Id"" = p.""ExpenseId"" AND p.""Month"" = @Month AND p.""Year"" = @Year
            WHERE m.""FamilyId"" = @FamilyId
              AND (
                  (re.""Type"" = 1 AND re.""Date"" >= @StartOfMonth AND re.""Date"" <= @EndOfMonth)
                  OR
                  (re.""Type"" = 2 AND re.""Status"" = true AND re.""StartDate"" <= @EndOfMonth AND (re.""EndDate"" IS NULL OR re.""EndDate"" >= @StartOfMonth))
              )";

        var incomesSql = @"
            SELECT 
                ri.""Id"",
                ri.""Description"" as ""Title"",
                ri.""Amount"",
                ri.""Type"",
                ri.""Date"",
                ri.""DueDay"",
                CASE WHEN p.""Id"" IS NOT NULL THEN true ELSE false END AS ""IsPaid""
            FROM ""Incomes"" ri
            INNER JOIN ""Members"" m ON ri.""MemberId"" = m.""Id""
            LEFT JOIN ""IncomePayments"" p ON ri.""Id"" = p.""IncomeId"" AND p.""Month"" = @Month AND p.""Year"" = @Year
            WHERE m.""FamilyId"" = @FamilyId
              AND (
                  (ri.""Type"" = 1 AND ri.""Date"" >= @StartOfMonth AND ri.""Date"" <= @EndOfMonth)
                  OR
                  (ri.""Type"" = 2 AND ri.""Status"" = true AND ri.""StartDate"" <= @EndOfMonth AND (ri.""EndDate"" IS NULL OR ri.""EndDate"" >= @StartOfMonth))
              )";

        var parameters = new { FamilyId = familyId, Year = year, Month = month, StartOfMonth = startOfMonth, EndOfMonth = endOfMonth };

        var expensesData = await connection.QueryAsync<dynamic>(expensesSql, parameters);
        var incomesData = await connection.QueryAsync<dynamic>(incomesSql, parameters);

        var dict = new Dictionary<string, CalendarIndicatorDto>();

        void EnsureDateExists(string dateStr)
        {
            if (!dict.ContainsKey(dateStr))
            {
                dict[dateStr] = new CalendarIndicatorDto
                {
                    Date = dateStr,
                    HasPayable = false,
                    HasReceivable = false,
                    Details = new List<CalendarDayDetailDto>()
                };
            }
        }

        var daysInMonth = DateTime.DaysInMonth(year, month);

        foreach (var exp in expensesData)
        {
            int type = exp.Type;
            int? dueDay = exp.DueDay;
            DateTime? date = exp.Date;
            
            var day = type == 1 && date.HasValue ? date.Value.Day : (dueDay ?? 1);
            day = Math.Min(day, daysInMonth);
            var dateStr = new DateTime(year, month, day).ToString("yyyy-MM-dd");
            EnsureDateExists(dateStr);
            
            dict[dateStr].HasPayable = true;
            dict[dateStr].Details.Add(new CalendarDayDetailDto
            {
                Id = exp.Id,
                Title = exp.Title,
                Amount = exp.Amount,
                Type = "payable",
                IsPaid = exp.IsPaid
            });
        }

        foreach (var inc in incomesData)
        {
            int type = inc.Type;
            int? dueDay = inc.DueDay;
            DateTime? date = inc.Date;

            var day = type == 1 && date.HasValue ? date.Value.Day : (dueDay ?? 1);
            day = Math.Min(day, daysInMonth);
            var dateStr = new DateTime(year, month, day).ToString("yyyy-MM-dd");
            EnsureDateExists(dateStr);
            
            dict[dateStr].HasReceivable = true;
            dict[dateStr].Details.Add(new CalendarDayDetailDto
            {
                Id = inc.Id,
                Title = inc.Title,
                Amount = inc.Amount,
                Type = "receivable",
                IsPaid = inc.IsPaid
            });
        }

        return dict.Values.OrderBy(x => x.Date).ToList();
    }
}