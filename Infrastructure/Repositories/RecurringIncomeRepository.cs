using Domain.Entities.RecurringIncomes;
using Domain.Entities.RecurringIncomes.ValueObjects;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class RecurringIncomeRepository(AppDbContext context) : IRecurringIncomeRepository
{
    public async Task<RecurringIncome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<RecurringIncome>()
            .Include(x => x.Member)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RecurringIncome>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<RecurringIncome>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task<decimal> GetTotalFixedIncomesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Database
            .SqlQuery<decimal>($@"
                SELECT COALESCE(SUM(""Amount""), 0) AS ""Value""
                FROM ""RecurringIncomes""
                WHERE ""MemberId"" = {memberId}
                  AND ""Status"" = {true}")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default)
    {
        await context.Set<RecurringIncome>().AddAsync(recurringIncome, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default)
    {
        context.Set<RecurringIncome>().Remove(recurringIncome);
        await context.SaveChangesAsync(cancellationToken);
    }
}
