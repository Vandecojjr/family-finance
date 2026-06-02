using Domain.Entities.Incomes;
using Domain.Enums;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class IncomeRepository(AppDbContext context) : IIncomeRepository
{
    public async Task<Income?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Income>()
            .Include(x => x.Member)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Income>> GetPlannedByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<Income>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId && x.Type == IncomeType.Planned)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task<IReadOnlyCollection<Income>> GetRecurringByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<Income>()
            .Include(x => x.Category)
            .Where(x => x.MemberId == memberId && x.Type == IncomeType.Recurring)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task<decimal> GetTotalFixedIncomesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Database
            .SqlQuery<decimal>($@"
                SELECT COALESCE(SUM(""Amount""), 0) AS ""Value""
                FROM ""Incomes""
                WHERE ""MemberId"" = {memberId}
                  AND ""Status"" = {true}")
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(Income income, CancellationToken cancellationToken = default)
    {
        await context.Set<Income>().AddAsync(income, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Income income, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Income income, CancellationToken cancellationToken = default)
    {
        context.Set<Income>().Remove(income);
        await context.SaveChangesAsync(cancellationToken);
    }
}
