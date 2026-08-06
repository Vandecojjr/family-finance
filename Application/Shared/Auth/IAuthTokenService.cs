using Domain.AccessContext.Entities.Accounts;

namespace Application.Shared.Auth;

public interface IAuthTokenService
{
    (string token, DateTime expiresAt) GenerateAccessToken(Account account, string? timezone = null);
    (string token, DateTime expiresAt) GenerateRefreshToken();
}

