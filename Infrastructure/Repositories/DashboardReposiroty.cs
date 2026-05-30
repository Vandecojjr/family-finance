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

        var general = await connection.QueryFirstOrDefaultAsync<General>(
            query.Sql,
            new { FamilyId = familyId.Value }
        );

        return new GetInitialDashBoardDto(general ?? new General(0, 0, 0, 0, 0, 0, 0));
    }
}