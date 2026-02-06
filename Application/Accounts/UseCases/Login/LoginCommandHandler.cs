using Application.Shared.Auth;
using Application.Shared.Responses;
using Application.Shared.Results;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.Login;

public sealed class LoginCommandHandler(
    IAccountRepository accountRepository,
    IPasswordHasher passwordHasher,
    IAuthTokenService authTokenService)
    : ICommandHandler<LoginCommand, Result<TokenPairResponse>>
{
    public async ValueTask<Result<TokenPairResponse>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var email = command.Email;
        var account = await accountRepository.GetByEmailAsync(email, cancellationToken);

        if (account is null)
            return Result<TokenPairResponse>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada."));
        
        if (!passwordHasher.Verify(command.Password, account.PasswordHash))
            return Result<TokenPairResponse>.Failure(Error.Failure("INVALID_CREDENTIALS", "Credenciais inválidas."));

        if (account.Status == AccountStatus.Blocked)
            return Result<TokenPairResponse>.Failure(Error.Failure("ACCOUNT_BLOCKED", "Conta bloqueada."));

        if (account.Status == AccountStatus.Inactive)
            return Result<TokenPairResponse>.Failure(Error.Failure("ACCOUNT_INACTIVE", "Conta inativa."));
        
        
        var (accessToken, accessExpiresAt) = authTokenService.GenerateAccessToken(account);
        var (refreshTokenStr, refreshExpiresAt) = authTokenService.GenerateRefreshToken();

        var refresh = new Domain.Entities.Accounts.RefreshToken(account.Id, refreshTokenStr, refreshExpiresAt);
        
        account.ClearExpiredRefreshTokens();
        account.AddRefreshToken(refresh);
        
        await accountRepository.UpdateAsync(account, cancellationToken);

        var dto = new TokenPairResponse(accessToken, accessExpiresAt, refreshTokenStr, refreshExpiresAt);
        return Result<TokenPairResponse>.Success(dto);
    }
}
