using Domain.Entities.PlannedIncomes;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PlannedIncomeRepository(AppDbContext context) : IPlannedIncomeRepository
{
    public async Task<PlannedIncome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<PlannedIncome>()
            .Include(x => x.Member)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PlannedIncome>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<PlannedIncome>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task AddAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default)
    {
        await context.Set<PlannedIncome>().AddAsync(plannedIncome, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default)
    {
        context.Set<PlannedIncome>().Remove(plannedIncome);
        await context.SaveChangesAsync(cancellationToken);
    }
}
