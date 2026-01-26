using Application.Shared.Auth;
using Application.Shared.Responses;
using Application.Shared.Results;
using Domain.Entities.Accounts;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.Login;

public sealed class LoginCommandHandler : ICommandHandler<LoginCommand, Result<TokenPairResponse>>
{
    private readonly IAccountRepository _accountRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuthTokenService _authTokenService;

    public LoginCommandHandler(
        IAccountRepository accountRepository,
        IPasswordHasher passwordHasher,
        IAuthTokenService authTokenService)
    {
        _accountRepository = accountRepository;
        _passwordHasher = passwordHasher;
        _authTokenService = authTokenService;
    }

    public async ValueTask<Result<TokenPairResponse>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var identifier = command.UsernameOrEmail.Trim();
        var account = identifier.Contains('@')
            ? await _accountRepository.GetByEmailAsync(identifier, cancellationToken)
            : await _accountRepository.GetByUsernameAsync(identifier, cancellationToken);

        if (account is null)
        {
            return Result<TokenPairResponse>.Failure(new Error("ACCOUNT_NOT_FOUND", "Conta não encontrada."));
        }

        if (!_passwordHasher.Verify(command.Password, account.PasswordHash))
        {
            return Result<TokenPairResponse>.Failure(new Error("INVALID_CREDENTIALS", "Credenciais inválidas."));
        }

        if (account.Status == AccountStatus.Blocked)
        {
            return Result<TokenPairResponse>.Failure(new Error("ACCOUNT_BLOCKED", "Conta bloqueada."));
        }

        if (account.Status == AccountStatus.Inactive)
        {
            return Result<TokenPairResponse>.Failure(new Error("ACCOUNT_INACTIVE", "Conta inativa."));
        }

        var (accessToken, accessExpiresAt) = _authTokenService.GenerateAccessToken(account);
        var (refreshTokenStr, refreshExpiresAt) = _authTokenService.GenerateRefreshToken();

        var refresh = new Domain.Entities.Accounts.RefreshToken(refreshTokenStr, refreshExpiresAt);
        await _accountRepository.RemoveExpiredRefreshTokensAsync(account.Id, cancellationToken);
        await _accountRepository.AddRefreshTokenAsync(account.Id, refresh, cancellationToken);

        var dto = new TokenPairResponse(accessToken, accessExpiresAt, refreshTokenStr, refreshExpiresAt);
        return Result<TokenPairResponse>.Success(dto);
    }
}
