using Application.Shared.Objects;
using Application.Shared.Repositories;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Queries.Incomes;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AccountsReceivableRepository(AppDbContext context) : IAccountsReceivableRepository
{
    public async Task<IReadOnlyCollection<AccountsReceivableDto>> GetAllByMember(Guid memberId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default)
    {
        var query = AccountsReceivableSql.GetAllByMember(memberId, onlyDate);
        
        return await context.Database
            .SqlQueryRaw<AccountsReceivableDto>(query.Sql, query.Parameters)
            .ToListAsync(cancellationToken);
    }
}
