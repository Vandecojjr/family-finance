using Application.Shared.Auth;
using Application.Shared.Responses;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;
using RefreshTokenEntity = Domain.AccessContext.Entities.Accounts.RefreshToken;

namespace Application.UseCases.Accounts.Login;

public sealed class LoginCommandHandler(
    IAccountRepository accountRepository,
    IPasswordHasher passwordHasher,
    IAuthTokenService authTokenService)
    : ICommandHandler<LoginCommand, Result<TokenPairResponse>>
{
    public async ValueTask<Result<TokenPairResponse>> Handle(
        LoginCommand command,
        CancellationToken cancellationToken)
    {
        var account = await accountRepository.GetByEmailAsync(command.Email, cancellationToken);

        if (account is null || !passwordHasher.Verify(command.Password, account.PasswordHash))
            return Result<TokenPairResponse>.Failure(
                Error.Failure("Auth.InvalidCredentials", "E-mail ou senha inválidos."));

        if (account.Status != Domain.Enums.AccountStatus.Active)
            return Result<TokenPairResponse>.Failure(
                Error.Failure("Auth.AccountInactive", "Conta inativa ou bloqueada."));

        var (accessToken, accessTokenExpiresAt) = authTokenService.GenerateAccessToken(account);
        var (refreshToken, refreshTokenExpiresAt) = authTokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity(account.Id, refreshToken, refreshTokenExpiresAt);
        account.AddRefreshToken(refreshTokenEntity);
        account.ClearExpiredRefreshTokens();

        await accountRepository.AddRefreshTokenAsync(account.Id, refreshTokenEntity, cancellationToken);

        var response = new TokenPairResponse(
            accessToken,
            accessTokenExpiresAt,
            refreshToken,
            refreshTokenExpiresAt);

        return Result<TokenPairResponse>.Success(response);
    }
}
