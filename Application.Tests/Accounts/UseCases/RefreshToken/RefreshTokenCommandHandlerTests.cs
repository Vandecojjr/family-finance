using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Accounts.UseCases.RefreshToken;
using Application.Shared.Auth;
using Application.Shared.Responses;
using Domain.Entities.Accounts;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Accounts.UseCases.RefreshToken;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<IAuthTokenService> _authTokenService = new();

    [Fact]
    public async Task Handle_Should_Return_New_Tokens_And_Revoke_Old_When_Refresh_Is_Valid()
    {
        // Arrange
        var account = new Account("john@mail.com", "hash", Guid.NewGuid());
        var existingRt = new Domain.Entities.Accounts.RefreshToken(account.Id, "old-rt", DateTime.UtcNow.AddHours(1));
        account.AddRefreshToken(existingRt);

        _accountRepo.Setup(r => r.GetByIdAsync(account.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(account);
        _accountRepo.Setup(r => r.GetRefreshTokenAsync("old-rt", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingRt);

        _authTokenService.Setup(s => s.GenerateAccessToken(account))
            .Returns(("new-at", DateTime.UtcNow.AddMinutes(15)));
        _authTokenService.Setup(s => s.GenerateRefreshToken())
            .Returns(("new-rt", DateTime.UtcNow.AddDays(7)));

        var handler = new RefreshTokenCommandHandler(_accountRepo.Object, _authTokenService.Object);
        var cmd = new RefreshTokenCommand(account.Id, "old-rt");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().BeOfType<TokenPairResponse>();
        _accountRepo.Verify(r => r.RevokeRefreshTokenAsync(account.Id, "old-rt", It.IsAny<CancellationToken>()), Times.Once);
        _accountRepo.Verify(r => r.RemoveExpiredRefreshTokensAsync(account.Id, It.IsAny<CancellationToken>()), Times.Once);
        _accountRepo.Verify(r => r.AddRefreshTokenAsync(account.Id, It.IsAny<Domain.Entities.Accounts.RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_Should_Fail_When_Refresh_Token_Not_Found()
    {
        // Arrange
        var account = new Account("mary@mail.com", "hash", Guid.NewGuid());
        _accountRepo.Setup(r => r.GetByIdAsync(account.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(account);

        var handler = new RefreshTokenCommandHandler(_accountRepo.Object, _authTokenService.Object);
        var cmd = new RefreshTokenCommand(account.Id, "unknown");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "INVALID_REFRESH_TOKEN");
    }
}
