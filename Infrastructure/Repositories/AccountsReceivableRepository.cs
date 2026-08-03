using Application.Shared.Objects;
using Application.Shared.Repositories;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Queries.Incomes;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AccountsReceivableRepository(AppDbContext context) : IAccountsReceivableRepository
{
    public async Task<IReadOnlyCollection<AccountsReceivableDto>> GetAllByFamily(Guid familyId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default)
    {
        var query = AccountsReceivableSql.GetAllByFamily(familyId, onlyDate);
        
        return await context.Database
            .SqlQueryRaw<AccountsReceivableDto>(query.Sql, query.Parameters)
            .ToListAsync(cancellationToken);
    }
}
