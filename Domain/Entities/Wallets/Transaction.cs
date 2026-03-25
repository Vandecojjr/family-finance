using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Transaction : Entity
{
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateTime Date { get; private set; }
    public TransactionType Type { get; private set; }
    
    public Guid AccountId { get; private set; }
    public virtual Account? Account { get; private set; }
    
    public Guid CategoryId { get; private set; }

    public Guid? TransferId { get; private set; }
    public bool IsInternalTransfer => TransferId.HasValue;

    public Guid MemberId { get; private set; }
    public Guid FamilyId { get; private set; }

    protected Transaction() { }

    private Transaction(
        string description, 
        decimal amount, 
        DateTime date, 
        TransactionType type, 
        Guid accountId, 
        Guid categoryId, 
        Guid memberId, 
        Guid familyId,
        Guid? transferId = null)
    {
        if (amount <= 0) throw new ArgumentException("O valor deve ser maior que zero.");

        Description = description;
        Amount = amount;
        Date = date;
        Type = type;
        AccountId = accountId;
        CategoryId = categoryId;
        MemberId = memberId;
        FamilyId = familyId;
        TransferId = transferId;
    }

    public static Transaction CreateExpense(string desc, decimal value, DateTime date, Guid accId, Guid catId, Guid memId, Guid famId)
        => new(desc, value, date, TransactionType.Expense, accId, catId, memId, famId);

    public static Transaction CreateIncome(string desc, decimal value, DateTime date, Guid accId, Guid catId, Guid memId, Guid famId)
        => new(desc, value, date, TransactionType.Income, accId, catId, memId, famId);

    public static Transaction CreateTransfer(string desc, decimal value, DateTime date, Guid accId, Guid catId, Guid memId, Guid famId, Guid transferId)
        => new(desc, value, date, TransactionType.Transfer, accId, catId, memId, famId, transferId);
}