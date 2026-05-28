using Domain.Entities.BankAccounts.Exceptions;
using Domain.Entities.CreidtCards.Exceptions;
using Domain.Entities.Wallets;
using Domain.Entities.Wallets.Exceptions;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Wallets;

public class WalletTests
{
    [Fact]
    public void Wallet_ShouldCreate_WhenValuesAreValid()
    {
        // Arrange
        var name = "Carteira Principal";
        var cashBalance = 150.50m;
        var familyId = Guid.NewGuid();

        // Act
        var wallet = new Wallet(name, cashBalance, familyId);

        // Assert
        Assert.Equal(name, wallet.Name.Value);
        Assert.Equal(cashBalance, wallet.CashBalance.Value);
        Assert.Equal(familyId, wallet.FamilyId);
        Assert.Empty(wallet.Accounts);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Wallet_ShouldThrow_WhenNameIsInvalid(string? name)
    {
        Assert.Throws<WalletNameRequiredException>(() => new Wallet(name!, 100m, Guid.NewGuid()));
    }

    [Fact]
    public void Wallet_ShouldThrow_WhenNameIsTooLong()
    {
        var longName = new string('A', 101);
        Assert.Throws<WalletNameTooLongException>(() => new Wallet(longName, 100m, Guid.NewGuid()));
    }

    [Fact]
    public void Wallet_ShouldThrow_WhenCashBalanceIsNegative()
    {
        Assert.Throws<InvalidCashBalanceException>(() => new Wallet("Test Wallet", -0.01m, Guid.NewGuid()));
    }

    [Fact]
    public void Wallet_ShouldUpdate_WhenValuesAreValid()
    {
        // Arrange
        var wallet = new Wallet("Original Name", 50m, Guid.NewGuid());

        // Act
        wallet.Update("Updated Name", 120.90m);

        // Assert
        Assert.Equal("Updated Name", wallet.Name.Value);
        Assert.Equal(120.90m, wallet.CashBalance.Value);
    }

    [Fact]
    public void Wallet_ShouldAddAccount_WhenValuesAreValid()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());

        // Act
        wallet.AddAccount("Nubank", AccountType.Checking, 500m, 1000m);

        // Assert
        Assert.Single(wallet.Accounts);
        var account = wallet.Accounts.First();
        Assert.Equal("Nubank", account.BankName.Value);
        Assert.Equal(AccountType.Checking, account.Type);
        Assert.Equal(500m, account.DebitBalance);
        Assert.Equal(1000m, account.CreditLimit.Value);
    }

    [Fact]
    public void Wallet_ShouldUpdateAccount_WhenAccountExists()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Nubank", AccountType.Checking, 500m, 1000m);
        var accountId = wallet.Accounts.First().Id;

        // Act
        wallet.UpdateAccount(accountId, "Nubank Ultravioleta", AccountType.Checking, 1500m, 5000m);

        // Assert
        var account = wallet.Accounts.First();
        Assert.Equal("Nubank Ultravioleta", account.BankName.Value);
        Assert.Equal(1500m, account.DebitBalance);
        Assert.Equal(5000m, account.CreditLimit.Value);
    }

    [Fact]
    public void Wallet_ShouldRemoveAccount_WhenAccountExists()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Nubank", AccountType.Checking, 500m, 1000m);
        var accountId = wallet.Accounts.First().Id;

        // Act
        wallet.RemoveAccount(accountId);

        // Assert
        Assert.Empty(wallet.Accounts);
    }

    [Fact]
    public void BankAccount_ShouldAddCreditCard_WhenValuesAreValid()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Nubank", AccountType.Checking, 500m, 1000m);
        var account = wallet.Accounts.First();

        // Act
        account.AddCreditCard("Visa", "4321", 5000m);

        // Assert
        Assert.Single(account.CreditCards);
        var card = account.CreditCards.First();
        Assert.Equal("Visa", card.Brand.Value);
        Assert.Equal("4321", card.LastFourDigits.Value);
        Assert.Equal(5000m, card.TotalLimit.Value);
    }

    [Fact]
    public void BankAccount_ShouldThrow_WhenCreditCardDigitsAreInvalid()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Nubank", AccountType.Checking, 500m, 1000m);
        var account = wallet.Accounts.First();

        // Act & Assert
        Assert.Throws<InvalidLastFourDigitsException>(() => account.AddCreditCard("Visa", "432", 5000m));
        Assert.Throws<InvalidLastFourDigitsException>(() => account.AddCreditCard("Visa", "4321a", 5000m));
    }

    [Fact]
    public void Wallet_ShouldAdjustCashBalance_WhenTypeIsIncomeOrExpense()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 100m, Guid.NewGuid());

        // Act
        wallet.AdjustCashBalance(50m, TransactionType.Income);
        // Assert
        Assert.Equal(150m, wallet.CashBalance.Value);

        // Act
        wallet.AdjustCashBalance(30m, TransactionType.Expense);
        // Assert
        Assert.Equal(120m, wallet.CashBalance.Value);
    }

    [Fact]
    public void Wallet_ShouldThrow_WhenExpenseExceedsCashBalance()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 10m, Guid.NewGuid());

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => wallet.AdjustCashBalance(15m, TransactionType.Expense));
    }

    [Fact]
    public void BankAccount_ShouldAdjustBalance_WhenTypeIsIncomeOrExpense()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 200m, 500m);
        var account = wallet.Accounts.First();

        // Act
        account.AdjustBalance(100m, TransactionType.Income, useCredit: false);
        // Assert
        Assert.Equal(300m, account.DebitBalance);

        // Act (Uses 400m of the 500m credit limit)
        account.AdjustBalance(400m, TransactionType.Expense, useCredit: true);
        // Assert
        Assert.Equal(300m, account.DebitBalance);
        Assert.Equal(100m, account.CreditLimit.Value);
    }

    [Fact]
    public void BankAccount_ShouldThrow_WhenExpenseExceedsDebitAndCreditLimit()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 200m, 500m);
        var account = wallet.Accounts.First();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => account.AdjustBalance(750m, TransactionType.Expense, useCredit: true));
    }

    [Fact]
    public void BankAccount_ShouldThrow_WhenCreditIncomeIsAttempted()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 200m, 500m);
        var account = wallet.Accounts.First();

        // Act & Assert
        Assert.Throws<BankAccountCreditTransactionMustBeExpenseException>(() => account.AdjustBalance(100m, TransactionType.Income, useCredit: true));
    }

    [Fact]
    public void BankAccount_ShouldThrow_WhenSourceIsNotSelected()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 200m, 500m);
        var account = wallet.Accounts.First();

        // Act & Assert
        Assert.Throws<BankAccountTransactionMustSelectSourceException>(() => account.AdjustBalance(100m, TransactionType.Income, useCredit: null));
    }

    [Fact]
    public void BankAccount_ShouldThrow_WhenDebitExpenseExceedsDebitBalance()
    {
        // Arrange
        var wallet = new Wallet("Wallet", 0m, Guid.NewGuid());
        wallet.AddAccount("Itaú", AccountType.Checking, 200m, 500m);
        var account = wallet.Accounts.First();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => account.AdjustBalance(250m, TransactionType.Expense, useCredit: false));
    }
}
