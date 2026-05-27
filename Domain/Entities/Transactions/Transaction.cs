using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Enums;
using Domain.Entities.Transactions.ValueObjects;

namespace Domain.Entities.Transactions;

public class Transaction : Entity, IAggregateRoot
{
    public TransactionDescription Description { get; private set; } = null!;
    public TransactionAmount Amount { get; private set; } = null!;
    public TransactionType Type { get; private set; }
    public DateTime Date { get; private set; }
    public Guid FamilyId { get; private set; }
    public Guid CategoryId { get; private set; }

    // Nullable foreign keys (for optional linking and SetNull behavior on delete)
    public Guid? WalletId { get; private set; }
    public Guid? BankAccountId { get; private set; }
    public Guid? CreditCardId { get; private set; }

    // Snapshot fields to preserve historical naming
    public string? WalletName { get; private set; }
    public string? BankAccountName { get; private set; }
    public string? CreditCardDisplayName { get; private set; }

    public string? Notes { get; private set; }

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Transaction()
    {
    }
    #pragma warning restore CS8618

    public Transaction(
        string description,
        decimal amount,
        TransactionType type,
        DateTime date,
        Guid familyId,
        Guid categoryId,
        Guid? walletId = null,
        Guid? bankAccountId = null,
        Guid? creditCardId = null,
        string? walletName = null,
        string? bankAccountName = null,
        string? creditCardDisplayName = null,
        string? notes = null)
    {
        Description = TransactionDescription.Create(description);
        Amount = TransactionAmount.Create(amount);
        Type = type;
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        FamilyId = familyId;
        CategoryId = categoryId;

        WalletId = walletId;
        BankAccountId = bankAccountId;
        CreditCardId = creditCardId;

        WalletName = walletName;
        BankAccountName = bankAccountName;
        CreditCardDisplayName = creditCardDisplayName;
        Notes = notes?.Trim();
    }
}
