using Domain.Entities.Families;
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

    public Wallet(string name, Guid memberId)
    {
        Name = name;
        MemberId = memberId;
    }

    public Account AddAccount(string name, bool isDebit, bool isCredit, bool isInvestment, bool isCash = false, decimal initialBalance = 0, decimal preApprovedCreditLimit = 0)
    {
        if (isCash && _accounts.Any(a => a.IsCash))
            throw new InvalidOperationException("A carteira já possui uma conta de dinheiro.");

        var account = new Account(name, Id, isDebit, isCredit, isInvestment, isCash, initialBalance, preApprovedCreditLimit);
        _accounts.Add(account);
        return account;
    }

    public void UpdateAccount(Guid accountId, string name)
    {
        var account = _accounts.FirstOrDefault(a => a.Id == accountId);
        if (account is null) throw new InvalidOperationException("Conta não encontrada na carteira.");

        account.UpdateName(name);
    }
}
