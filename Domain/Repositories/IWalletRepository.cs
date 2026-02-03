using Domain.Entities.Wallets;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IWalletRepository : IRepository<Wallet>
{
    Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    
    // Custom query to support "My Wallets" (Family + Personal)
    // Actually, usually this logic is better in a specific query method or composed in the handler, 
    // but having a dedicated optimized query is good for performance.
    Task<List<Wallet>> GetWalletsForUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default);
}
