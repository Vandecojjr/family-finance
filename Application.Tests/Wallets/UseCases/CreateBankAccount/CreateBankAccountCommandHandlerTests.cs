using Application.Shared.Auth;
using Application.Wallets.UseCases.CreateBankAccount;
using Domain.Entities.Families;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Wallets.UseCases.CreateBankAccount;

public class CreateBankAccountCommandHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly CreateBankAccountCommandHandler _handler;

    public CreateBankAccountCommandHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new CreateBankAccountCommandHandler(
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenWalletBelongsToFamilyAndValuesAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var wallet = new Wallet("Carteira Principal", 200m, family.Id);

        var command = new CreateBankAccountCommand(
            wallet.Id,
            "Nubank",
            AccountType.Checking,
            1000m,
            2000m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        wallet.Accounts.Should().ContainSingle(a => a.BankName.Value == "Nubank");
        _walletRepositoryMock.Verify(
            repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenWalletDoesNotExist()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var walletId = Guid.NewGuid();
        var command = new CreateBankAccountCommand(
            walletId,
            "Nubank",
            AccountType.Checking,
            1000m,
            2000m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(walletId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Wallet?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "Wallet.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenWalletDoesNotBelongToUserFamily()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var otherFamilyId = Guid.NewGuid();
        var wallet = new Wallet("Other Wallet", 0m, otherFamilyId);

        var command = new CreateBankAccountCommand(
            wallet.Id,
            "Nubank",
            AccountType.Checking,
            1000m,
            2000m);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "Family.AccessDenied");
    }
}
