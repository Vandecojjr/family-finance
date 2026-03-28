using Domain.Entities.Wallets;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IWalletRepository : IRepository<Wallet>
{
    Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
    Task UpdateAsync(Wallet wallet, CancellationToken cancellationToken = default);
    
    Task<Wallet?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Wallet?> GetByIdWithAccountsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Wallet?> GetByIdWithAccountsAndTransactionsAsync(Guid id, CancellationToken cancellationToken = default);
    
    Task<List<Wallet>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<Wallet>> GetWalletsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<Domain.Entities.Wallets.Transaction>> GetRecentTransactionsAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default);
    Task<Wallet?> GetByAccountIdAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<(List<Transaction> Items, int TotalCount)> GetTransactionsPagedAsync(Guid accountId, int page, int pageSize, CancellationToken cancellationToken = default);
}
