using Application.Shared.Auth;
using Application.UseCases.Transactions.RegisterTransaction;
using Domain.Entities.Families;
using Domain.Entities.Categories;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Transactions.UseCases.RegisterTransaction;

public class RegisterTransactionCommandHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly RegisterTransactionCommandHandler _handler;

    public RegisterTransactionCommandHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();

        _handler = new RegisterTransactionCommandHandler(
            _walletRepositoryMock.Object,
            _categoryRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldRegisterCashTransaction_AndDecreaseWalletBalance_WhenTypeIsExpense()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Supermercado", CategoryType.Expense, family.Id);
        var wallet = new Wallet("Dinheiro Mão", 500m, family.Id);

        var command = new RegisterTransactionCommand(
            "Compra Pão",
            50m,
            TransactionType.Expense,
            DateTime.UtcNow,
            category.Id,
            wallet.Id,
            null,
            null,
            null,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(category.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();

        wallet.CashBalance.Value.Should().Be(450m);
        wallet.Transactions.Should().ContainSingle(t => t.Id == result.Value);

        _walletRepositoryMock.Verify(repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldRegisterAccountTransaction_AndIncreaseAccountBalance_WhenTypeIsIncome()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var category = new Category("Salário", CategoryType.Income, family.Id);
        var wallet = new Wallet("Banco", 0m, family.Id);
        wallet.AddAccount("Itaú", AccountType.Checking, 1500m, 5000m);
        var account = wallet.Accounts.First();

        var command = new RegisterTransactionCommand(
            "Salário Mensal",
            3000m,
            TransactionType.Income,
            DateTime.UtcNow,
            category.Id,
            wallet.Id,
            account.Id,
            null,
            false,
            null);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _categoryRepositoryMock
            .Setup(repo => repo.GetByIdAsync(category.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        account.DebitBalance.Should().Be(4500m);
        wallet.Transactions.Should().ContainSingle(t => t.Id == result.Value);

        _walletRepositoryMock.Verify(repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()), Times.Once);
    }
}
