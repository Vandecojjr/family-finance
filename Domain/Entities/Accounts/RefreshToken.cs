using Domain.Shared.Entities;

namespace Domain.Entities.Accounts;

public class RefreshToken : Entity
{
    public string Token { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;

    public RefreshToken(string token, DateTime expiresAt)
    {
        Token = token;
        ExpiresAt = expiresAt;
    }

    public void Revoke()
    {
        RevokedAt = DateTime.UtcNow;
    }
}
