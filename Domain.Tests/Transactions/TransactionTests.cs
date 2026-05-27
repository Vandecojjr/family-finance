using Domain.Entities.Transactions;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Transactions;

public class TransactionTests
{
    [Fact]
    public void Transaction_ShouldCreate_WhenValuesAreValid()
    {
        // Arrange
        var description = "Supermercado";
        var amount = 250.75m;
        var type = TransactionType.Expense;
        var date = DateTime.UtcNow;
        var familyId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var walletId = Guid.NewGuid();
        var walletName = "Carteira Principal";

        // Act
        var transaction = new Transaction(
            description,
            amount,
            type,
            date,
            familyId,
            categoryId,
            walletId,
            null,
            null,
            walletName);

        // Assert
        Assert.Equal(description, transaction.Description.Value);
        Assert.Equal(amount, transaction.Amount.Value);
        Assert.Equal(type, transaction.Type);
        Assert.Equal(date, transaction.Date);
        Assert.Equal(familyId, transaction.FamilyId);
        Assert.Equal(categoryId, transaction.CategoryId);
        Assert.Equal(walletId, transaction.WalletId);
        Assert.Null(transaction.BankAccountId);
        Assert.Null(transaction.CreditCardId);
        Assert.Equal(walletName, transaction.WalletName);
        Assert.Null(transaction.BankAccountName);
        Assert.Null(transaction.CreditCardDisplayName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Transaction_ShouldThrow_WhenDescriptionIsInvalid(string? description)
    {
        Assert.Throws<Domain.Entities.Transactions.Exceptions.TransactionDescriptionRequiredException>(() => new Transaction(
            description!,
            100m,
            TransactionType.Income,
            DateTime.UtcNow,
            Guid.NewGuid(),
            Guid.NewGuid()));
    }

    [Fact]
    public void Transaction_ShouldThrow_WhenAmountIsZeroOrNegative()
    {
        Assert.Throws<Domain.Entities.Transactions.Exceptions.InvalidTransactionAmountException>(() => new Transaction(
            "Test",
            0m,
            TransactionType.Income,
            DateTime.UtcNow,
            Guid.NewGuid(),
            Guid.NewGuid()));

        Assert.Throws<Domain.Entities.Transactions.Exceptions.InvalidTransactionAmountException>(() => new Transaction(
            "Test",
            -15.50m,
            TransactionType.Income,
            DateTime.UtcNow,
            Guid.NewGuid(),
            Guid.NewGuid()));
    }
}
