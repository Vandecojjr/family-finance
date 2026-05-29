using Application.Shared.Auth;
using Application.UseCases.Transactions.DeleteTransaction;
using Domain.Entities.Families;
using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Entities.Transactions.ValueObjects;
using Domain.Enums;
using Domain.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace Application.Tests.Transactions.UseCases.DeleteTransaction;

public class DeleteTransactionCommandHandlerTests
{
    private readonly Mock<IWalletRepository> _walletRepositoryMock;
    private readonly Mock<IFamilyRepository> _familyRepositoryMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly DeleteTransactionCommandHandler _handler;

    public DeleteTransactionCommandHandlerTests()
    {
        _walletRepositoryMock = new Mock<IWalletRepository>();
        _familyRepositoryMock = new Mock<IFamilyRepository>();
        _currentUserMock = new Mock<ICurrentUser>();

        _handler = new DeleteTransactionCommandHandler(
            _walletRepositoryMock.Object,
            _familyRepositoryMock.Object,
            _currentUserMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenTryingToDeleteTransaction()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var wallet = new Wallet("Dinheiro", 100m, family.Id);
        var transaction = new Transaction(
            "Pão",
            50m,
            TransactionType.Expense,
            DateTime.UtcNow,
            family.Id,
            Guid.NewGuid(),
            wallet.Id,
            null,
            null,
            null,
            TransactionMetadata.Create("Dinheiro"));

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetTransactionByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        var result = await _handler.Handle(new DeleteTransactionCommand(transaction.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "Transaction.CannotBeDeleted");

        _walletRepositoryMock.Verify(repo => repo.UpdateAsync(It.IsAny<Wallet>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenTransactionNotFound()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetTransactionByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction?)null);

        // Act
        var result = await _handler.Handle(new DeleteTransactionCommand(Guid.NewGuid()), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "Transaction.NotFound");
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenAccessDenied()
    {
        // Arrange
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var currentMember = family.Members.First();

        var otherFamilyId = Guid.NewGuid();
        var wallet = new Wallet("Dinheiro", 100m, otherFamilyId);
        var transaction = new Transaction(
            "Pão",
            50m,
            TransactionType.Expense,
            DateTime.UtcNow,
            otherFamilyId,
            Guid.NewGuid(),
            wallet.Id,
            null,
            null,
            null,
            TransactionMetadata.Create("Dinheiro"));

        _currentUserMock.Setup(u => u.MemberId).Returns(currentMember.Id);
        _familyRepositoryMock
            .Setup(repo => repo.GetMemberByIdAsync(currentMember.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentMember);
        _walletRepositoryMock
            .Setup(repo => repo.GetTransactionByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        // Act
        var result = await _handler.Handle(new DeleteTransactionCommand(transaction.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Code == "Family.AccessDenied");
    }
}


