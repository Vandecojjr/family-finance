using Application.Shared.Auth;
using Application.Transactions.UseCases.DeleteTransaction;
using Domain.Entities.Families;
using Domain.Entities.Wallets;
using Domain.Entities.Transactions;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Transactions.UseCases.DeleteTransaction;

public class DeleteTransactionCommandHandlerTests
{
    private readonly Mock<ITransactionRepository> _transactionRepositoryMock;
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly DeleteTransactionCommandHandler _handler;

    public DeleteTransactionCommandHandlerTests()
    {
        _transactionRepositoryMock = new Mock<ITransactionRepository>();
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();

        _handler = new DeleteTransactionCommandHandler(
            _transactionRepositoryMock.Object,
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldDeleteTransaction_AndReverseCashBalance_WhenExpenseIsDeleted()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var wallet = new Wallet("Dinheiro", 100m, family.Id);
        // Note: Original cash balance before transaction deleted is 100m. Since we delete an expense of 50m, balance should return to 150m.
        var transaction = new Transaction(
            "Pão",
            50m,
            TransactionType.Expense,
            DateTime.UtcNow,
            family.Id,
            Guid.NewGuid(),
            wallet.Id);

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _transactionRepositoryMock
            .Setup(repo => repo.GetByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(wallet.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(wallet);

        // Act
        var result = await _handler.Handle(new DeleteTransactionCommand(transaction.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        wallet.CashBalance.Should().Be(150m);

        _walletRepositoryMock.Verify(repo => repo.UpdateAsync(wallet, It.IsAny<CancellationToken>()), Times.Once);
        _transactionRepositoryMock.Verify(repo => repo.DeleteAsync(transaction, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldDeleteTransaction_WithoutError_WhenWalletAlreadyDeleted()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var transaction = new Transaction(
            "Pão",
            50m,
            TransactionType.Expense,
            DateTime.UtcNow,
            family.Id,
            Guid.NewGuid(),
            Guid.NewGuid()); // Guid is set, but wallet won't exist in repo

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _transactionRepositoryMock
            .Setup(repo => repo.GetByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);
        _walletRepositoryMock
            .Setup(repo => repo.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Wallet?)null); // Wallet not found in DB

        // Act
        var result = await _handler.Handle(new DeleteTransactionCommand(transaction.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue(); // Should still succeed to delete transaction log

        _walletRepositoryMock.Verify(repo => repo.UpdateAsync(It.IsAny<Wallet>(), It.IsAny<CancellationToken>()), Times.Never);
        _transactionRepositoryMock.Verify(repo => repo.DeleteAsync(transaction, It.IsAny<CancellationToken>()), Times.Once);
    }
}
