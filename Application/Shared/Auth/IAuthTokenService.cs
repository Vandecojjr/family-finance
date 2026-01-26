using Domain.Entities.Accounts;

namespace Application.Shared.Auth;

public interface IAuthTokenService
{
    (string token, DateTime expiresAt) GenerateAccessToken(Account account);
    (string token, DateTime expiresAt) GenerateRefreshToken();
}
