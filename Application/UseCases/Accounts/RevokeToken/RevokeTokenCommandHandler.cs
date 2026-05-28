using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Accounts.RevokeToken;

public sealed class RevokeTokenCommandHandler(IAccountRepository accountRepository)
    : ICommandHandler<RevokeTokenCommand, Result>
{
    public async ValueTask<Result> Handle(
        RevokeTokenCommand command,
        CancellationToken cancellationToken)
    {
        var token = await accountRepository.GetRefreshTokenAsync(command.RefreshToken, cancellationToken);

        if (token is null)
            return Result.Failure(
                Error.NotFound("Auth.TokenNotFound", "Refresh token não encontrado."));

        if (!token.IsActive)
            return Result.Failure(
                Error.Failure("Auth.TokenAlreadyRevoked", "Refresh token já foi revogado ou expirou."));

        await accountRepository.RevokeRefreshTokenAsync(token.AccountId, command.RefreshToken, cancellationToken);

        return Result.Success();
    }
}
