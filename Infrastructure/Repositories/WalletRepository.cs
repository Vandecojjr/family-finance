using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class WalletRepository(AppDbContext context) : IWalletRepository
{
    public async Task<Wallet?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Include(x => x.Accounts)
                .ThenInclude(x => x.CreditCards)
            .Include(x => x.Transactions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Wallet>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<Wallet>()
            .Include(x => x.Accounts)
                .ThenInclude(x => x.CreditCards)
            .Include(x => x.Transactions)
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        await context.Set<Wallet>().AddAsync(wallet, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        context.Set<Wallet>().Remove(wallet);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Transaction?> GetTransactionByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Transaction>()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Transaction>> GetTransactionsByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var list = await context.Set<Transaction>()
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);
        return list.AsReadOnly();
    }

    public async Task DeleteTransactionAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        context.Set<Transaction>().Remove(transaction);
        await context.SaveChangesAsync(cancellationToken);
    }
}
