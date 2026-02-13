using Application.Shared.Auth;
using Application.Wallets.UseCases.CreatePersonalWallet;
using Domain.Entities.Families;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Wallets.UseCases.CreatePersonalWallet;

public class CreatePersonalWalletHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly CreatePersonalWalletHandler _handler;

    public CreatePersonalWalletHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new CreatePersonalWalletHandler(
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccess_WhenFamilyExists()
    {
        var memberId = Guid.NewGuid();
        var family = new Family("Test Family");
        var command = new CreatePersonalWalletCommand("My Wallet", WalletType.Checking, 150.00m);

        _currentUserMock.Setup(x => x.MemberId).Returns(memberId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(family);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _walletRepositoryMock.Verify(x => x.AddAsync(It.Is<Wallet>(w => 
            w.Name == command.Name && 
            w.FamilyId == family.Id && 
            w.OwnerId == memberId && 
            w.CurrentBalance == command.InitialBalance), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenFamilyNotFound()
    {
        var memberId = Guid.NewGuid();
        var command = new CreatePersonalWalletCommand("My Wallet", WalletType.Checking, 150.00m);

        _currentUserMock.Setup(x => x.MemberId).Returns(memberId);
        _familyRepositoryMock.Setup(x => x.GetByMemberIdAsync(memberId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Family?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "FAMILY_NOT_FOUND");
        _walletRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Wallet>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
