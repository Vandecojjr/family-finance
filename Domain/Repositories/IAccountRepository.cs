using Domain.Entities.Accounts;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IAccountRepository : IRepository<Account>
{
    Task<Account?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Account?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<Account?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Account?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);

    Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task AddAsync(Account account, CancellationToken cancellationToken = default);
    Task UpdateAsync(Account account, CancellationToken cancellationToken = default);

    Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<bool> ExistsRefreshTokenAsync(string token, CancellationToken cancellationToken = default);
    Task AddRefreshTokenAsync(Guid accountId, RefreshToken token, CancellationToken cancellationToken = default);
    Task RevokeRefreshTokenAsync(Guid accountId, string token, CancellationToken cancellationToken = default);
    Task RevokeAllRefreshTokensAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task RemoveExpiredRefreshTokensAsync(Guid accountId, CancellationToken cancellationToken = default);
}