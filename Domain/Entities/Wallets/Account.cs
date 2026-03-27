using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Account : Entity
{
    public string Name { get; private set; } = string.Empty;
    public AccountType Type { get; private set; }
    public Guid WalletId { get; private set; }
    public virtual Wallet? Wallet { get; private set; }

    public decimal Balance { get; private set; }

    public decimal? CreditLimit { get; private set; }
    public decimal UsedCredit { get; private set; }
    public int? ClosingDay { get; private set; }
    public int? DueDay { get; private set; }

    private readonly List<Transaction> _transactions = [];
    public virtual IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    protected Account() { }

    private Account(string name, AccountType type, Guid walletId, decimal initialBalance = 0)
    {
        Name = name;
        Type = type;
        WalletId = walletId;
        Balance = initialBalance;
    }

    public static Account CreateAssetAccount(string name, AccountType type, Guid walletId, decimal initialBalance = 0)
    {
        if (type == AccountType.Credit)
            throw new InvalidOperationException("Use CreateCreditAccount para cartões de crédito.");

        return new Account(name, type, walletId, initialBalance);
    }

    public static Account CreateCreditAccount(string name, Guid walletId, decimal limit, int closingDay, int dueDay)
    {
        return new Account(name, AccountType.Credit, walletId)
        {
            CreditLimit = limit,
            ClosingDay = closingDay,
            DueDay = dueDay,
            Balance = 0
        };
    }

    public decimal GetCurrentBalance()
    {
        return Type == AccountType.Credit ? -GetUsedCredit() : Balance;
    }

    public void UpdateName(string name)
    {
        Name = name;
    }

    public void AddTransaction(Transaction transaction)
    {
        if (transaction.AccountId != Id) throw new ArgumentException("A transação não pertence a esta conta.");
        
        _transactions.Add(transaction);

        if (Type == AccountType.Credit)
        {
            if (transaction.Type == TransactionType.Expense)
                UsedCredit += transaction.Amount;
            else if (transaction.Type == TransactionType.Income)
                UsedCredit -= transaction.Amount;
        }
        else
        {
            if (transaction.Type == TransactionType.Income)
                Balance += transaction.Amount;
            else if (transaction.Type == TransactionType.Expense || transaction.Type == TransactionType.Transfer)
                Balance -= transaction.Amount;
        }
    }

    public decimal GetUsedCredit() => UsedCredit;

    public decimal GetAvailableLimit()
    {
        if (Type != AccountType.Credit) return 0;
        return (CreditLimit ?? 0) - GetUsedCredit();
    }
}