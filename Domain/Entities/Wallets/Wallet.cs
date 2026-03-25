using Domain.Entities.Families;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Wallet : Entity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public Guid MemberId { get; private set; }
    public virtual Member? Member { get; private set; }

    private readonly List<Account> _accounts = [];
    public virtual IReadOnlyCollection<Account> Accounts => _accounts.AsReadOnly();

    protected Wallet() { }

    public Wallet(string name, Guid memberId, decimal initialBalance = 0)
    {
        Name = name;
        MemberId = memberId;
    }
    
    public static Wallet CreatePersonal(string name, Guid ownerId, decimal initialBalance = 0)
    {
        return new Wallet(name, ownerId, initialBalance);
    }

    public Account AddAssetAccount(string name, AccountType type, decimal initialBalance = 0)
    {
        var account = Account.CreateAssetAccount(name, type, Id, initialBalance);
        _accounts.Add(account);
        return account;
    }

    public Account AddCreditAccount(string name, decimal limit, int closingDay, int dueDay)
    {
        var account = Account.CreateCreditAccount(name, Id, limit, closingDay, dueDay);
        _accounts.Add(account);
        return account;
    }

    public void UpdateAccount(Guid accountId, string name)
    {
        var account = _accounts.FirstOrDefault(a => a.Id == accountId);
        if (account is null) throw new InvalidOperationException("Conta não encontrada na carteira.");

        account.UpdateName(name);
    }

    public void RemoveAccount(Guid accountId)
    {
        var account = _accounts.FirstOrDefault(a => a.Id == accountId);
        if (account is null) throw new InvalidOperationException("Conta não encontrada na carteira.");

        _accounts.Remove(account);
    }
}
