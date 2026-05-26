using Domain.Entities.RecurringExpenses;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IRecurringExpenseRepository : IRepository<RecurringExpense>
{
    Task<RecurringExpense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<RecurringExpense>> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalFixedExpensesByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default);
    Task UpdateAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default);
    Task DeleteAsync(RecurringExpense recurringExpense, CancellationToken cancellationToken = default);
}
