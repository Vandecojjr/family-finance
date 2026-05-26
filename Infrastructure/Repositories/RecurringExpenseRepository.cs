using Domain.Entities.RecurringExpenses;
using Domain.Entities.RecurringExpenses.ValueObjects;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class RecurringExpenseRepository(AppDbContext context) : IRecurringExpenseRepository
{
    public async Task<RecurringExpense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<RecurringExpense>()
            .Include(x => x.Member)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RecurringExpense>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<RecurringExpense>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task<decimal> GetTotalFixedExpensesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Database
            .SqlQuery<decimal>($@"
                SELECT COALESCE(SUM(""Amount""), 0) AS ""Value""
                FROM ""RecurringExpenses""
                WHERE ""MemberId"" = {memberId}
                  AND ""Status"" = {true}")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default)
    {
        await context.Set<RecurringExpense>().AddAsync(recurringExpense, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default)
    {
        context.Set<RecurringExpense>().Remove(recurringExpense);
        await context.SaveChangesAsync(cancellationToken);
    }
}
