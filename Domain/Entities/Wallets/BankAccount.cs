using Domain.Shared.Entities;
using Domain.Enums;
using Domain.Entities.Wallets.ValueObjects;

namespace Domain.Entities.Wallets;

public class BankAccount : Entity
{
    public Guid WalletId { get; private set; }
    public BankName BankName { get; private set; } = null!;
    public AccountType Type { get; private set; }
    public decimal DebitBalance { get; private set; }
    public CreditLimit CreditLimit { get; private set; } = null!;

    public virtual Wallet Wallet { get; private set; } = null!;

    private readonly List<CreditCard> _creditCards = [];
    public virtual IReadOnlyCollection<CreditCard> CreditCards => _creditCards.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected BankAccount()
    {
    }
    #pragma warning restore CS8618

    public BankAccount(string bankName, AccountType type, decimal debitBalance, decimal creditLimit, Guid walletId)
    {
        BankName = BankName.Create(bankName);
        Type = type;
        DebitBalance = debitBalance;
        CreditLimit = CreditLimit.Create(creditLimit);
        WalletId = walletId;
    }

    public void Update(string bankName, AccountType type, decimal debitBalance, decimal creditLimit)
    {
        BankName = BankName.Create(bankName);
        Type = type;
        DebitBalance = debitBalance;
        CreditLimit = CreditLimit.Create(creditLimit);
        SeUpdate();
    }

    public void AddCreditCard(string brand, string lastFourDigits, decimal totalLimit)
    {
        var card = new CreditCard(brand, lastFourDigits, totalLimit, Id);
        _creditCards.Add(card);
        SeUpdate();
    }

    public void RemoveCreditCard(Guid cardId)
    {
        var card = _creditCards.FirstOrDefault(c => c.Id == cardId);
        if (card != null)
        {
            _creditCards.Remove(card);
            SeUpdate();
        }
    }

    public void AdjustBalance(decimal amount, TransactionType type)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));

        if (type == TransactionType.Income)
        {
            DebitBalance += amount;
        }
        else if (type == TransactionType.Expense)
        {
            var availableFunds = DebitBalance + CreditLimit.Value;
            if (availableFunds < amount)
                throw new InvalidOperationException("Saldo e limite de crédito insuficientes para realizar esta transação.");
            
            DebitBalance -= amount;
        }
        SeUpdate();
    }
}
