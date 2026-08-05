using System.Data;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Dapper;
using Infrastructure.Queries.Expanses.Dashboard;

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
}