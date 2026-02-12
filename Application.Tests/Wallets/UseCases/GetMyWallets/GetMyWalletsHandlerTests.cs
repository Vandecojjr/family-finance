using Application.Shared.Auth;
using Application.Wallets.UseCases.GetMyWallets;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using Moq;
using Xunit;

namespace Application.Tests.Wallets.UseCases.GetMyWallets;

public class GetMyWalletsHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetMyWalletsHandler _handler;

    public GetMyWalletsHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetMyWalletsHandler(
            _walletRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnWallets_WhenWalletsExist()
    {
        var accountId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var familyId = Guid.NewGuid();

        _currentUserMock.Setup(x => x.AccountId).Returns(accountId);

        var wallets = new List<Wallet>
        {
            new("Carteira 1", familyId, WalletType.Checking, memberId, 100),
            new("Carteira 2", familyId, WalletType.Checking, memberId, 200)
        };

        _walletRepositoryMock.Setup(x => x.GetWalletsForUserAsync(accountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallets);

        var query = new GetMyWalletsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal("Carteira 1", result.Value[0].Name);
        Assert.Equal("Carteira 2", result.Value[1].Name);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoWalletsExist()
    {
        var memberId = Guid.NewGuid();
        _currentUserMock.Setup(x => x.AccountId).Returns(memberId);

        _walletRepositoryMock
            .Setup(x => x.GetWalletsForUserAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Wallet>());

        var query = new GetMyWalletsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Empty(result.Value);
    }
}
