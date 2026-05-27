using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Enums;
using Domain.Entities.Wallets.ValueObjects;

namespace Domain.Entities.Wallets;

public class Wallet : Entity, IAggregateRoot
{
    public WalletName Name { get; private set; } = null!;
    public CashBalance CashBalance { get; private set; } = null!;
    public Guid FamilyId { get; private set; }

    private readonly List<BankAccount> _accounts = [];
    public virtual IReadOnlyCollection<BankAccount> Accounts => _accounts.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Wallet()
    {
    }
    #pragma warning restore CS8618

    public Wallet(string name, decimal cashBalance, Guid familyId)
    {
        Name = WalletName.Create(name);
        CashBalance = CashBalance.Create(cashBalance);
        FamilyId = familyId;
    }

    public void Update(string name, decimal cashBalance)
    {
        Name = WalletName.Create(name);
        CashBalance = CashBalance.Create(cashBalance);
        SeUpdate();
    }

    public void AddAccount(string bankName, AccountType type, decimal debitBalance, decimal creditLimit)
    {
        var account = new BankAccount(bankName, type, debitBalance, creditLimit, Id);
        _accounts.Add(account);
        SeUpdate();
    }

    public void UpdateAccount(Guid accountId, string bankName, AccountType type, decimal debitBalance, decimal creditLimit)
    {
        var account = _accounts.FirstOrDefault(a => a.Id == accountId);
        if (account != null)
        {
            account.Update(bankName, type, debitBalance, creditLimit);
            SeUpdate();
        }
    }

    public void RemoveAccount(Guid accountId)
    {
        var account = _accounts.FirstOrDefault(a => a.Id == accountId);
        if (account != null)
        {
            _accounts.Remove(account);
            SeUpdate();
        }
    }

    public void AdjustCashBalance(decimal amount, TransactionType type)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));

        if (type == TransactionType.Income)
        {
            CashBalance = CashBalance.Create(CashBalance.Value + amount);
        }
        else if (type == TransactionType.Expense)
        {
            if (CashBalance.Value < amount)
                throw new InvalidOperationException("Saldo em dinheiro vivo insuficiente para realizar esta despesa.");
            CashBalance = CashBalance.Create(CashBalance.Value - amount);
        }
        SeUpdate();
    }
}
