using Domain.Entities.Wallets;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IWalletRepository : IRepository<Wallet>
{
    Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetWalletsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
