using Domain.Shared.Entities;
using Domain.Enums;

namespace Domain.Entities.Wallets;

public class BankAccount : Entity
{
    public Guid WalletId { get; private set; }
    public string BankName { get; private set; } = null!;
    public AccountType Type { get; private set; }
    public decimal DebitBalance { get; private set; }
    public decimal CreditLimit { get; private set; }

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
        if (string.IsNullOrWhiteSpace(bankName))
            throw new ArgumentException("O nome do banco é obrigatório.", nameof(bankName));
        if (bankName.Length > 100)
            throw new ArgumentException("O nome do banco deve ter no máximo 100 caracteres.", nameof(bankName));
        if (creditLimit < 0)
            throw new ArgumentException("O limite de crédito deve ser maior ou igual a zero.", nameof(creditLimit));

        BankName = bankName.Trim();
        Type = type;
        DebitBalance = debitBalance;
        CreditLimit = creditLimit;
        WalletId = walletId;
    }

    public void Update(string bankName, AccountType type, decimal debitBalance, decimal creditLimit)
    {
        if (string.IsNullOrWhiteSpace(bankName))
            throw new ArgumentException("O nome do banco é obrigatório.", nameof(bankName));
        if (bankName.Length > 100)
            throw new ArgumentException("O nome do banco deve ter no máximo 100 caracteres.", nameof(bankName));
        if (creditLimit < 0)
            throw new ArgumentException("O limite de crédito deve ser maior ou igual a zero.", nameof(creditLimit));

        BankName = bankName.Trim();
        Type = type;
        DebitBalance = debitBalance;
        CreditLimit = creditLimit;
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
}
