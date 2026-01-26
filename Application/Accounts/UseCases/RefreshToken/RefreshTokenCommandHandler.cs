using Application.Shared.Auth;
using Application.Shared.Responses;
using Application.Shared.Results;
using Domain.Entities.Accounts;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.RefreshToken;

public sealed class RefreshTokenCommandHandler : ICommandHandler<RefreshTokenCommand, Result<TokenPairResponse>>
{
    private readonly IAccountRepository _accountRepository;
    private readonly IAuthTokenService _authTokenService;

    public RefreshTokenCommandHandler(
        IAccountRepository accountRepository,
        IAuthTokenService authTokenService)
    {
        _accountRepository = accountRepository;
        _authTokenService = authTokenService;
    }

    public async ValueTask<Result<TokenPairResponse>> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetByIdAsync(command.AccountId, cancellationToken);
        if (account is null)
        {
            return Result<TokenPairResponse>.Failure(new Error("ACCOUNT_NOT_FOUND", "Conta não encontrada."));
        }

        var storedToken = await _accountRepository.GetRefreshTokenAsync(command.RefreshToken, cancellationToken);
        if (storedToken is null || !storedToken.IsActive)
        {
            return Result<TokenPairResponse>.Failure(new Error("INVALID_REFRESH_TOKEN", "Refresh token inválido ou expirado."));
        }

        await _accountRepository.RevokeRefreshTokenAsync(account.Id, command.RefreshToken, cancellationToken);

        var (accessToken, accessExpiresAt) = _authTokenService.GenerateAccessToken(account);
        var (newRefreshToken, newRefreshExpiresAt) = _authTokenService.GenerateRefreshToken();

        await _accountRepository.RemoveExpiredRefreshTokensAsync(account.Id, cancellationToken);
        await _accountRepository.AddRefreshTokenAsync(account.Id, new Domain.Entities.Accounts.RefreshToken(newRefreshToken, newRefreshExpiresAt), cancellationToken);

        var dto = new TokenPairResponse(accessToken, accessExpiresAt, newRefreshToken, newRefreshExpiresAt);
        return Result<TokenPairResponse>.Success(dto);
    }
}
