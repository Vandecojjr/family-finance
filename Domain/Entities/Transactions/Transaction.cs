using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Enums;

namespace Domain.Entities.Transactions;

public class Transaction : Entity, IAggregateRoot
{
    public string Description { get; private set; } = null!;
    public decimal Amount { get; private set; }
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
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição da transação é obrigatória.", nameof(description));
        if (description.Length > 100)
            throw new ArgumentException("A descrição da transação deve ter no máximo 100 caracteres.", nameof(description));
        if (amount <= 0)
            throw new ArgumentException("O valor da transação deve ser maior que zero.", nameof(amount));

        Description = description.Trim();
        Amount = amount;
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
