using Domain.Entities.PlannedIncomes;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IPlannedIncomeRepository : IRepository<PlannedIncome>
{
    Task<PlannedIncome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<PlannedIncome>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default);
    Task UpdateAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default);
    Task DeleteAsync(PlannedIncome plannedIncome, CancellationToken cancellationToken = default);
}
