using Application.Shared.Auth;
using Application.UseCases.Wallets.CreateCreditCard;
using Domain.Entities.Families;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using Domain.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Wallets.UseCases.CreateCreditCard;

public class CreateCreditCardCommandHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<ICreditCardCreationService> _creditCardCreationServiceMock;
    private readonly CreateCreditCardCommandHandler _handler;

    public CreateCreditCardCommandHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();
        _creditCardCreationServiceMock = new Mock<ICreditCardCreationService>();
        _handler = new CreateCreditCardCommandHandler(
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object,
            _creditCardCreationServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccessResult_WhenWalletAccountAndValuesAreValid()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var wallet = new Wallet("Carteira Principal", 200m, family.Id, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 1500m, 3000m);
        var account = wallet.Accounts.First();

        var command = new CreateCreditCardCommand(
            wallet.Id,
            account.Id,
            "Visa",
            "1234",
            5000m,
            5000m,
            10,
            Guid.NewGuid());

        var expectedCardId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);
        
        _creditCardCreationServiceMock
            .Setup(s => s.CreateCreditCardWithInvoicesAsync(wallet, account.Id, "Visa", "1234", 5000m, 5000m, 10, command.CategoryId, currentMember.Id, It.IsAny<List<(DateTime, decimal)>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedCardId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(expectedCardId);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailureResult_WhenBankAccountDoesNotExist()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var wallet = new Wallet("Carteira Principal", 200m, family.Id, Guid.NewGuid());
        var nonExistentAccountId = Guid.NewGuid();

        var command = new CreateCreditCardCommand(
            wallet.Id,
            nonExistentAccountId,
            "Visa",
            "1234",
            5000m,
            5000m,
            10,
            Guid.NewGuid());

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
        result.Errors.Should().ContainSingle(e => e.Code == "BankAccount.NotFound");
    }
}


