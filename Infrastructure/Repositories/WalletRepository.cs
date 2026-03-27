using Domain.Entities.Wallets;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class WalletRepository(AppDbContext context) : IWalletRepository
{
    public async Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        await context.Set<Wallet>().AddAsync(wallet, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Wallet wallet, CancellationToken cancellationToken = default)
    {
        context.Set<Wallet>().Update(wallet);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Wallet?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<Wallet?> GetByIdWithAccountsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Include(w => w.Accounts)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<Wallet?> GetByIdWithAccountsAndTransactionsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Include(w => w.Accounts)
                .ThenInclude(a => a.Transactions)
            .Include(w => w.Member)
                .ThenInclude(m => m!.Family)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<List<Wallet>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Where(x => x.MemberId == ownerId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Wallet>> GetWalletsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Include(w => w.Accounts)
                .ThenInclude(a => a.Transactions)
            .Where(w => w.MemberId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Transaction>> GetRecentTransactionsAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        return await context.Set<Transaction>()
            .Include(t => t.Account)
                .ThenInclude(a => a.Wallet)
            .Include(t => t.Category)
            .Where(t => t.MemberId == userId)
            .OrderByDescending(t => t.Date)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<Transaction> Items, int TotalCount)> GetTransactionsPagedAsync(Guid accountId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = context.Set<Transaction>()
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.Date);

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
