using Domain.Entities.Incomes;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IIncomeRepository : IRepository<Income>
{
    Task<Income?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Income>> GetPlannedByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Income>> GetRecurringByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalFixedIncomesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(Income income, CancellationToken cancellationToken = default);
    Task UpdateAsync(Income income, CancellationToken cancellationToken = default);
    Task DeleteAsync(Income income, CancellationToken cancellationToken = default);
}
