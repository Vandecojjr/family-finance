using Domain.Shared.Entities;
using Domain.Entities.Transactions.Exceptions;

namespace Domain.Entities.Transactions.ValueObjects;

public sealed record TransactionMetadata : ValueObject
{
    public string? WalletName { get; }
    public string? BankAccountName { get; }
    public string? CreditCardDisplayName { get; }
    public string? Notes { get; }

    private TransactionMetadata(string? walletName, string? bankAccountName, string? creditCardDisplayName, string? notes)
    {
        WalletName = walletName?.Trim();
        BankAccountName = bankAccountName?.Trim();
        CreditCardDisplayName = creditCardDisplayName?.Trim();
        Notes = notes?.Trim();
    }

    public static TransactionMetadata Create(
        string? walletName = null,
        string? bankAccountName = null,
        string? creditCardDisplayName = null,
        string? notes = null)
    {
        if (walletName?.Length > 100)
            throw new TransactionWalletNameTooLongException();

        if (bankAccountName?.Length > 100)
            throw new TransactionBankAccountNameTooLongException();

        if (creditCardDisplayName?.Length > 150)
            throw new TransactionCreditCardDisplayNameTooLongException();

        if (notes?.Length > 500)
            throw new TransactionNotesTooLongException();

        return new TransactionMetadata(walletName, bankAccountName, creditCardDisplayName, notes);
    }

    public static TransactionMetadata Empty => new(null, null, null, null);
}
