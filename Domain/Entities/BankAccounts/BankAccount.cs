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
    public CreditLimit RemainingCreditLimit { get; private set; } = null!;

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
        RemainingCreditLimit = CreditLimit.Create(creditLimit);
        WalletId = walletId;
    }

    public void Update(string bankName, AccountType type, decimal debitBalance, decimal creditLimit)
    {
        var diff = creditLimit - CreditLimit.Value;
        BankName = BankName.Create(bankName);
        Type = type;
        DebitBalance = debitBalance;
        CreditLimit = CreditLimit.Create(creditLimit);
        RemainingCreditLimit = CreditLimit.Create(Math.Max(0, RemainingCreditLimit.Value + diff));
        SeUpdate();
    }
    public void AddCreditCard(string brand, string lastFourDigits, decimal totalLimit, decimal availableLimit, int dueDay, IEnumerable<CreditCardInvoice>? initialInvoices = null)
    {
        var card = new CreditCard(brand, lastFourDigits, totalLimit, availableLimit, dueDay, Id, initialInvoices);
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

    public (string DisplayName, IReadOnlyCollection<Domain.Entities.CreidtCards.CreditCardInvoice> AffectedInvoices) RegisterCreditCardTransaction(decimal amount, TransactionType type, Guid creditCardId, DateTime transactionDate, int installments = 1, bool? forceNextInvoice = null)
    {
        if (type == TransactionType.Income || type == TransactionType.TransferIn)
            throw new CreditCardTransactionMustBeExpenseException();

        var card = _creditCards.FirstOrDefault(c => c.Id == creditCardId);
        if (card == null)
            throw new InvalidOperationException($"Cartão de crédito com ID '{creditCardId}' não foi encontrado nesta conta.");

        card.AdjustBalance(amount, type);
        var affectedInvoices = card.AddExpenseToInvoices(amount, transactionDate, installments, forceNextInvoice);

        return ($"{card.Brand.Value} •••• {card.LastFourDigits.Value}", affectedInvoices);
    }

    public void AdjustBalance(decimal amount, TransactionType type, bool? useCredit)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));

        if (useCredit == null)
            throw new BankAccountTransactionMustSelectSourceException();

        if (useCredit.Value)
        {
            if (type == TransactionType.Income || type == TransactionType.TransferIn)
                throw new BankAccountCreditTransactionMustBeExpenseException();

            if (RemainingCreditLimit.Value < amount)
                throw new InvalidOperationException("Saldo e limite de crédito insuficientes para realizar esta transação.");
            
            RemainingCreditLimit = CreditLimit.Create(RemainingCreditLimit.Value - amount);
        }
        else
        {
            if (type == TransactionType.Income || type == TransactionType.TransferIn)
            {
                DebitBalance += amount;
            }
            else if (type == TransactionType.Expense || type == TransactionType.TransferOut)
            {
                if (DebitBalance < amount)
                    throw new InvalidOperationException("Saldo em conta insuficiente.");

                DebitBalance -= amount;
            }
        }
        SeUpdate();
    }

    public decimal UsageCreditLimit() => CreditLimit.Value - RemainingCreditLimit.Value;

    public void RevertTransaction(decimal amount, TransactionType type, bool? useCredit)
    {
        if (useCredit.HasValue && useCredit.Value)
        {
            var newLimit = RemainingCreditLimit.Value + amount;
            if (newLimit > CreditLimit.Value) newLimit = CreditLimit.Value;
            RemainingCreditLimit = CreditLimit.Create(newLimit);
        }
        else
        {
            if (type == TransactionType.Income || type == TransactionType.TransferIn)
            {
                DebitBalance -= amount;
            }
            else if (type == TransactionType.Expense || type == TransactionType.TransferOut)
            {
                DebitBalance += amount;
            }
        }
        SeUpdate();
    }
}
