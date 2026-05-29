using Domain.Entities.Expenses;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ExpenseRepository(AppDbContext context) : IExpenseRepository
{
    public async Task<Expense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Expenses
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Expense>> GetAllByMemberAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Expenses
            .Include(x => x.Payments)
            .Where(x => x.MemberId == memberId)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(Expense expense, CancellationToken cancellationToken = default)
    {
        context.Expenses.Add(expense);
        return context.SaveChangesAsync(cancellationToken);
    }

    public Task UpdateAsync(Expense expense, CancellationToken cancellationToken = default)
    {
        context.Expenses.Update(expense);
        return context.SaveChangesAsync(cancellationToken);
    }

    public Task DeleteAsync(Expense expense, CancellationToken cancellationToken = default)
    {
        context.Expenses.Remove(expense);
        return context.SaveChangesAsync(cancellationToken);
    }
}
