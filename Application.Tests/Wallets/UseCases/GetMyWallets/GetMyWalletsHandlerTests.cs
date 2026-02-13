using Application.Shared.Auth;
using Application.Wallets.UseCases.GetMyWallets;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
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
        var memberId = Guid.NewGuid();
        var familyId = Guid.NewGuid();

        _currentUserMock.Setup(x => x.MemberId).Returns(memberId);

        var wallets = new List<Wallet>
        {
            new("Carteira 1", familyId, WalletType.Checking, memberId, 100),
            new("Carteira 2", familyId, WalletType.Checking, memberId, 200)
        };

        _walletRepositoryMock.Setup(x => x.GetWalletsForUserAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallets);

        var query = new GetMyWalletsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().HaveCount(2);
        result.Value![0].Name.Should().Be("Carteira 1");
        result.Value![1].Name.Should().Be("Carteira 2");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoWalletsExist()
    {
        var memberId = Guid.NewGuid();
        _currentUserMock.Setup(x => x.MemberId).Returns(memberId);

        _walletRepositoryMock
            .Setup(x => x.GetWalletsForUserAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Wallet>());

        var query = new GetMyWalletsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().BeEmpty();
    }
}
