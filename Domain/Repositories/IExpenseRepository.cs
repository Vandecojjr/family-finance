using Domain.Entities.Expenses;

namespace Domain.Repositories;

public interface IExpenseRepository
{
    Task<Expense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Expense>> GetAllByMemberAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Expense>> GetAllRecurringByMemberAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Expense>> GetAllPlannedByMemberAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task AddAsync(Expense expense, CancellationToken cancellationToken = default);
    Task UpdateAsync(Expense expense, CancellationToken cancellationToken = default);
    Task DeleteAsync(Expense expense, CancellationToken cancellationToken = default);
}
