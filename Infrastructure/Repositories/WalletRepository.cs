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

    public async Task<List<Wallet>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Wallet>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Wallet>()
            .Where(x => x.OwnerId == ownerId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Wallet>> GetWalletsForUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default)
    {
        // Rule: FamilyId matches AND (OwnerId is NULL [Family Wallet] OR OwnerId is User [Personal Wallet])
        return await context.Set<Wallet>()
            .Where(w => w.FamilyId == familyId && (w.OwnerId == null || w.OwnerId == userId))
            .ToListAsync(cancellationToken);
    }
}
