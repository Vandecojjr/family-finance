using Domain.Entities.PlannedExpenses;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PlannedExpenseRepository(AppDbContext context) : IPlannedExpenseRepository
{
    public async Task<PlannedExpense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<PlannedExpense>()
            .Include(x => x.Member)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PlannedExpense>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<PlannedExpense>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task AddAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default)
    {
        await context.Set<PlannedExpense>().AddAsync(plannedExpense, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default)
    {
        context.Set<PlannedExpense>().Remove(plannedExpense);
        await context.SaveChangesAsync(cancellationToken);
    }
}
