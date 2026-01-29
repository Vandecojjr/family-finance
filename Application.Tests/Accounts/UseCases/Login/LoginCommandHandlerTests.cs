using Application.Accounts.UseCases.Login;
using Application.Shared.Auth;
using Application.Shared.Responses;
using Domain.Entities.Accounts;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Accounts.UseCases.Login;

public class LoginCommandHandlerTests
{
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IPasswordHasher> _passwordHasher = new();
    private readonly Mock<IAuthTokenService> _authTokenService = new();

    [Fact]
    public async Task Handle_Should_Return_Success_With_Tokens_When_Credentials_Are_Valid()
    {
        // Arrange
        var account = new Account("john", "john@mail.com", "hash")
        {
        };
        _accountRepo.Setup(r => r.GetByUsernameAsync("john", It.IsAny<CancellationToken>()))
            .ReturnsAsync(account);
        _passwordHasher.Setup(h => h.Verify("plain", "hash")).Returns(true);
        _authTokenService.Setup(s => s.GenerateAccessToken(It.IsAny<Account>()))
            .Returns(("access-token", DateTime.UtcNow.AddMinutes(15)));
        _authTokenService.Setup(s => s.GenerateRefreshToken())
            .Returns(("refresh-token", DateTime.UtcNow.AddDays(7)));

        var handler = new LoginCommandHandler(_accountRepo.Object, _passwordHasher.Object, _authTokenService.Object);
        var cmd = new LoginCommand("john", "plain");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().BeOfType<TokenPairResponse>();
        result.Value!.AccessToken.Should().Be("access-token");
        result.Value!.RefreshToken.Should().Be("refresh-token");
        _accountRepo.Verify(r => r.UpdateAsync(account, It.IsAny<CancellationToken>()), Times.Once());
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Password_Is_Invalid()
    {
        // Arrange
        var account = new Account("john", "john@mail.com", "hash");
        _accountRepo.Setup(r => r.GetByUsernameAsync("john", It.IsAny<CancellationToken>()))
            .ReturnsAsync(account);
        _passwordHasher.Setup(h => h.Verify("wrong", "hash")).Returns(false);

        var handler = new LoginCommandHandler(_accountRepo.Object, _passwordHasher.Object, _authTokenService.Object);
        var cmd = new LoginCommand("john", "wrong");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "INVALID_CREDENTIALS");
        _authTokenService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Account_Is_Blocked()
    {
        // Arrange
        var account = new Account("john", "john@mail.com", "hash");
        account.Block();
        _accountRepo.Setup(r => r.GetByUsernameAsync("john", It.IsAny<CancellationToken>()))
            .ReturnsAsync(account);
        _passwordHasher.Setup(h => h.Verify("plain", "hash")).Returns(true);

        var handler = new LoginCommandHandler(_accountRepo.Object, _passwordHasher.Object, _authTokenService.Object);
        var cmd = new LoginCommand("john", "plain");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "ACCOUNT_BLOCKED");
    }
}
