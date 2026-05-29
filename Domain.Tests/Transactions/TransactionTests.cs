using Domain.Entities.Transactions;
using Domain.Enums;
using Xunit;

using Domain.Entities.Transactions.ValueObjects;

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
        var metadata = TransactionMetadata.Create(walletName: walletName);

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
            null,
            metadata);

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
        Assert.Equal(walletName, transaction.Metadata.WalletName);
        Assert.Null(transaction.Metadata.BankAccountName);
        Assert.Null(transaction.Metadata.CreditCardDisplayName);
        Assert.Null(transaction.Metadata.Notes);
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
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            null,
            null,
            null));
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
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            null,
            null,
            null));

        Assert.Throws<Domain.Entities.Transactions.Exceptions.InvalidTransactionAmountException>(() => new Transaction(
            "Test",
            -15.50m,
            TransactionType.Income,
            DateTime.UtcNow,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            null,
            null,
            null));
    }

    [Fact]
    public void TransactionMetadata_ShouldThrow_WhenWalletNameIsTooLong()
    {
        var longWalletName = new string('A', 101);
        Assert.Throws<Domain.Entities.Transactions.Exceptions.TransactionWalletNameTooLongException>(() => 
            TransactionMetadata.Create(walletName: longWalletName));
    }

    [Fact]
    public void TransactionMetadata_ShouldThrow_WhenBankAccountNameIsTooLong()
    {
        var longBankAccountName = new string('A', 101);
        Assert.Throws<Domain.Entities.Transactions.Exceptions.TransactionBankAccountNameTooLongException>(() => 
            TransactionMetadata.Create(bankAccountName: longBankAccountName));
    }

    [Fact]
    public void TransactionMetadata_ShouldThrow_WhenCreditCardDisplayNameIsTooLong()
    {
        var longCardName = new string('A', 151);
        Assert.Throws<Domain.Entities.Transactions.Exceptions.TransactionCreditCardDisplayNameTooLongException>(() => 
            TransactionMetadata.Create(creditCardDisplayName: longCardName));
    }

    [Fact]
    public void TransactionMetadata_ShouldThrow_WhenNotesAreTooLong()
    {
        var longNotes = new string('A', 501);
        Assert.Throws<Domain.Entities.Transactions.Exceptions.TransactionNotesTooLongException>(() => 
            TransactionMetadata.Create(notes: longNotes));
    }
}


