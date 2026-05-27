using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Enums;

namespace Domain.Entities.Wallets;

public class Wallet : Entity, IAggregateRoot
{
    public string Name { get; private set; } = null!;
    public decimal CashBalance { get; private set; }
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
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome da carteira é obrigatório.", nameof(name));
        if (name.Length > 100)
            throw new ArgumentException("O nome da carteira deve ter no máximo 100 caracteres.", nameof(name));
        if (cashBalance < 0)
            throw new ArgumentException("O saldo em dinheiro vivo deve ser maior ou igual a zero.", nameof(cashBalance));

        Name = name.Trim();
        CashBalance = cashBalance;
        FamilyId = familyId;
    }

    public void Update(string name, decimal cashBalance)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome da carteira é obrigatório.", nameof(name));
        if (name.Length > 100)
            throw new ArgumentException("O nome da carteira deve ter no máximo 100 caracteres.", nameof(name));
        if (cashBalance < 0)
            throw new ArgumentException("O saldo em dinheiro vivo deve ser maior ou igual a zero.", nameof(cashBalance));

        Name = name.Trim();
        CashBalance = cashBalance;
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
            CashBalance += amount;
        }
        else if (type == TransactionType.Expense)
        {
            if (CashBalance < amount)
                throw new InvalidOperationException("Saldo em dinheiro vivo insuficiente para realizar esta despesa.");
            CashBalance -= amount;
        }
        SeUpdate();
    }
}
