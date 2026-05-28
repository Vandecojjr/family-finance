using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IWalletRepository : IRepository<Wallet>
{
    Task<Wallet?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Wallet>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task AddAsync(Wallet wallet, CancellationToken cancellationToken = default);
    Task UpdateAsync(Wallet wallet, CancellationToken cancellationToken = default);
    Task DeleteAsync(Wallet wallet, CancellationToken cancellationToken = default);

    Task<Transaction?> GetTransactionByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<Transaction>> GetTransactionsByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task DeleteTransactionAsync(Transaction transaction, CancellationToken cancellationToken = default);
}
