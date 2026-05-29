using Application.Shared.Auth;
using Application.Shared.Responses;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;
using RefreshTokenEntity = Domain.AccessContext.Entities.Accounts.RefreshToken;

namespace Application.UseCases.Accounts.RefreshToken;

public sealed class RefreshTokenCommandHandler(
    IAccountRepository accountRepository,
    IAuthTokenService authTokenService)
    : ICommandHandler<RefreshTokenCommand, Result<TokenPairResponse>>
{
    public async ValueTask<Result<TokenPairResponse>> Handle(
        RefreshTokenCommand command,
        CancellationToken cancellationToken)
    {
        var existingToken = await accountRepository.GetRefreshTokenAsync(command.RefreshToken, cancellationToken);

        if (existingToken is null || !existingToken.IsActive)
            return Result<TokenPairResponse>.Failure(
                Error.Failure("Auth.InvalidRefreshToken", "Refresh token inválido ou expirado."));

        var account = await accountRepository.GetByIdAsync(existingToken.AccountId, cancellationToken);

        if (account is null)
            return Result<TokenPairResponse>.Failure(
                Error.NotFound("Auth.AccountNotFound", "Conta não encontrada."));

        if (account.Status != Domain.Enums.AccountStatus.Active)
            return Result<TokenPairResponse>.Failure(
                Error.Failure("Auth.AccountInactive", "Conta inativa ou bloqueada."));

        // Revoke the used refresh token (rotation)
        await accountRepository.RevokeRefreshTokenAsync(account.Id, command.RefreshToken, cancellationToken);

        var (accessToken, accessTokenExpiresAt) = authTokenService.GenerateAccessToken(account);
        var (newRefreshToken, newRefreshTokenExpiresAt) = authTokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshTokenEntity(account.Id, newRefreshToken, newRefreshTokenExpiresAt);
        await accountRepository.AddRefreshTokenAsync(account.Id, refreshTokenEntity, cancellationToken);

        var response = new TokenPairResponse(
            accessToken,
            accessTokenExpiresAt,
            newRefreshToken,
            newRefreshTokenExpiresAt);

        return Result<TokenPairResponse>.Success(response);
    }
}

