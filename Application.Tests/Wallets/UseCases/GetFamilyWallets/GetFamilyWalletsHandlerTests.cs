using Application.Shared.Auth;
using Application.Wallets.UseCases.GetFamilyWallets;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Wallets.UseCases.GetFamilyWallets;

public class GetFamilyWalletsHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly GetFamilyWalletsHandler _handler;

    public GetFamilyWalletsHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new GetFamilyWalletsHandler(
            _walletRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnWallets_ForFamily()
    {
        var familyId = Guid.NewGuid();
        var query = new GetFamilyWalletsQuery(familyId);
        var wallets = new List<Wallet>
        {
            new Wallet("Wallet 1", familyId, WalletType.Checking),
            new Wallet("Wallet 2", familyId, WalletType.Savings)
        };

        _walletRepositoryMock.Setup(x => x.GetByFamilyIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallets);

        var result = await _handler.Handle(query, CancellationToken.None);

        result.Value.Should().Contain(x => x.Name == "Wallet 1");
        result.Value.Should().Contain(x => x.Name == "Wallet 2");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoWalletsExist()
    {
        var familyId = Guid.NewGuid();
        var query = new GetFamilyWalletsQuery(familyId);

        _walletRepositoryMock.Setup(x => x.GetByFamilyIdAsync(familyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Wallet>());

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().BeEmpty();
    }
}
