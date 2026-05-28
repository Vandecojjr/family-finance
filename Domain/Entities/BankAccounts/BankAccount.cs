using Domain.Entities.BankAccounts.Exceptions;
using Domain.Entities.BankAccounts.ValueObjects;
using Domain.Entities.CreidtCards;
using Domain.Entities.CreidtCards.Exceptions;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.BankAccounts;

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
        if (card == null) 
            return;
        
        _creditCards.Remove(card);
        SeUpdate();
    }

    public string RegisterCreditCardTransaction(decimal amount, TransactionType type, Guid creditCardId)
    {
        if (type == TransactionType.Income)
            throw new CreditCardTransactionMustBeExpenseException();

        var card = _creditCards.FirstOrDefault(c => c.Id == creditCardId);
        if (card == null)
            throw new InvalidOperationException($"Cartão de crédito com ID '{creditCardId}' não foi encontrado nesta conta.");

        card.AdjustBalance(amount, type);

        return $"{card.Brand.Value} •••• {card.LastFourDigits.Value}";
    }

    public void AdjustBalance(decimal amount, TransactionType type, bool? useCredit)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));

        if (useCredit == null)
            throw new BankAccountTransactionMustSelectSourceException();

        if (useCredit.Value)
        {
            if (type == TransactionType.Income)
                throw new BankAccountCreditTransactionMustBeExpenseException();

            if (CreditLimit.Value < amount)
                throw new InvalidOperationException("Saldo e limite de crédito insuficientes para realizar esta transação.");
            
            CreditLimit = CreditLimit.Create(CreditLimit.Value - amount);
        }
        else
        {
            if (type == TransactionType.Income)
            {
                DebitBalance += amount;
            }
            else if (type == TransactionType.Expense)
            {
                if (DebitBalance < amount)
                    throw new InvalidOperationException("Saldo em conta insuficiente.");

                DebitBalance -= amount;
            }
        }
        SeUpdate();
    }
}
