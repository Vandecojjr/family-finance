using Application.Shared.Objects;
using Application.Shared.Repositories;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Queries.Expanses;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AccountsPayableRepository(AppDbContext context) : IAccountsPayableRepository
{
    public async Task<IReadOnlyCollection<AccountsPayableDto>> GetAllByFamily(Guid familyId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default)
    {
        var query = AccountsPayableSql.GetAllByFamily(familyId, onlyDate);
        
        return await context.Database
            .SqlQueryRaw<AccountsPayableDto>(query.Sql, query.Parameters)
            .ToListAsync(cancellationToken);
    }
}