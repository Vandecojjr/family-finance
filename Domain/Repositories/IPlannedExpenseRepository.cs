using Domain.Entities.PlannedExpenses;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IPlannedExpenseRepository : IRepository<PlannedExpense>
{
    Task<PlannedExpense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PlannedExpense>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default);
    Task UpdateAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default);
    Task DeleteAsync(PlannedExpense plannedExpense, CancellationToken cancellationToken = default);
}
