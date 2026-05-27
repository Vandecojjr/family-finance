using Domain.Shared.Entities;
using Domain.AccessContext.Entities.Accounts.ValueObjects;

namespace Domain.AccessContext.Entities.Accounts;

public class RefreshToken : Entity
{
    public Guid AccountId { get; private set; }
    public RefreshTokenValue Token { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;

    public RefreshToken(Guid accountId, string token, DateTime expiresAt)
    {
        AccountId = accountId;
        Token = RefreshTokenValue.Create(token);
        ExpiresAt = expiresAt;
    }

    public void Revoke()
    {
        RevokedAt = DateTime.UtcNow;
    }
}
