using Domain.Entities.RecurringIncomes;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IRecurringIncomeRepository : IRepository<RecurringIncome>
{
    Task<RecurringIncome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<RecurringIncome>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalFixedIncomesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default);
    Task UpdateAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default);
    Task DeleteAsync(RecurringIncome recurringIncome, CancellationToken cancellationToken = default);
}
