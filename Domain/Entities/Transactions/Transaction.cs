using Domain.Shared.Entities;
using Domain.Enums;
using Domain.Entities.Transactions.ValueObjects;

namespace Domain.Entities.Transactions;

public class Transaction : Entity
{
    public TransactionDescription Description { get; private set; } = null!;
    public TransactionAmount Amount { get; private set; } = null!;
    public TransactionType Type { get; private set; }
    public DateTime Date { get; private set; }
    public Guid FamilyId { get; private set; }
    public Guid CategoryId { get; private set; }

    public Guid? WalletId { get; private set; }
    public Guid? BankAccountId { get; private set; }
    public Guid? CreditCardId { get; private set; }

    public bool? UseCredit { get; private set; }

    public TransactionMetadata Metadata { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Transaction()
    {
    }
    #pragma warning restore CS8618

    internal Transaction(
        string description,
        decimal amount,
        TransactionType type,
        DateTime date,
        Guid familyId,
        Guid categoryId,
        Guid? walletId,
        Guid? bankAccountId,
        Guid? creditCardId,
        bool? useCredit,
        TransactionMetadata? metadata)
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
        UseCredit = useCredit;

        Metadata = metadata ?? TransactionMetadata.Empty;
    }
}
