using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Account : Entity
{
    public string Name { get; private set; } = string.Empty;
    
    // Capabilities
    public bool IsDebit { get; private set; }
    public bool IsCredit { get; private set; }
    public bool IsInvestment { get; private set; }
    public bool IsCash { get; private set; }

    public Guid WalletId { get; private set; }
    public virtual Wallet? Wallet { get; private set; }

    // Asset logic (Debit / Investment)
    public decimal Balance { get; private set; }
    public decimal InvestmentBalance { get; private set; }

    // Credit logic (Pre-approved / Overdraft)
    public decimal PreApprovedCreditLimit { get; private set; }
    public decimal UsedPreApprovedCredit { get; private set; }

    // Relationships
    private readonly List<Card> _cards = [];
    public virtual IReadOnlyCollection<Card> Cards => _cards.AsReadOnly();

    private readonly List<Transaction> _transactions = [];
    public virtual IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    protected Account() { }

    private Account(string name, Guid walletId, bool isDebit, bool isCredit, bool isInvestment, bool isCash, decimal initialBalance = 0, decimal preApprovedCreditLimit = 0)
    {
        Name = name;
        WalletId = walletId;
        IsDebit = isDebit;
        IsCredit = isCredit;
        IsInvestment = isInvestment;
        IsCash = isCash;
        Balance = initialBalance;
        PreApprovedCreditLimit = preApprovedCreditLimit;
    }

    public static Account Create(string name, Guid walletId, bool isDebit, bool isCredit, bool isInvestment, bool isCash = false, decimal initialBalance = 0, decimal preApprovedCreditLimit = 0)
    {
        return new Account(name, walletId, isDebit, isCredit, isInvestment, isCash, initialBalance, preApprovedCreditLimit);
    }

    public void UpdateName(string name)
    {
        Name = name;
    }

    public void UpdateCapabilities(bool isDebit, bool isCredit, bool isInvestment)
    {
        IsDebit = isDebit;
        IsCredit = isCredit;
        IsInvestment = isInvestment;
    }

    public void UpdatePreApprovedCreditLimit(decimal newLimit)
    {
        if (newLimit < 0) throw new ArgumentException("O limite não pode ser negativo.");
        PreApprovedCreditLimit = newLimit;
    }

    public void AddCard(Card card)
    {
        if (card.AccountId != Id) throw new ArgumentException("O cartão não pertence a esta conta.");
        if (_cards.Count > 0) throw new InvalidOperationException("Esta conta já possui um cartão cadastrado.");
        _cards.Add(card);
        IsCredit = true; // Ensure credit capability is enabled if a card is added
    }

    public void AddTransaction(Transaction transaction)
    {
        if (transaction.AccountId != Id) throw new ArgumentException("A transação não pertence a esta conta.");
        
        _transactions.Add(transaction);

        if (transaction.Type == TransactionType.Income)
        {
            // Income always adds to balance for now. 
            // Logic for paying credit invoices will be handled via transfers or specific categories.
            Balance += transaction.Amount;
        }
        else if (transaction.Type == TransactionType.Expense || transaction.Type == TransactionType.Transfer)
        {
            if (transaction.CardId.HasValue)
            {
                var card = _cards.FirstOrDefault(c => c.Id == transaction.CardId.Value);
                if (card == null) throw new InvalidOperationException("Cartão não encontrado nesta conta.");
                card.AddSpending(transaction.Amount);
            }
            else if (transaction.IsCredit)
            {
                UsedPreApprovedCredit += transaction.Amount;
            }
            else
            {
                Balance -= transaction.Amount;
            }
        }
        else if (transaction.Type == TransactionType.Investment)
        {
            Balance -= transaction.Amount;
            InvestmentBalance += transaction.Amount;
        }
        else if (transaction.Type == TransactionType.Redemption)
        {
            InvestmentBalance -= transaction.Amount;
            Balance += transaction.Amount;
        }
    }

    public decimal GetAvailableCredit()
    {
        // 90% of InvestmentBalance is considered as collateral limit
        decimal collateralLimit = Math.Round(InvestmentBalance * 0.9m, 2);
        decimal totalLimit = PreApprovedCreditLimit + collateralLimit - UsedPreApprovedCredit;
        foreach (var card in _cards)
        {
            totalLimit += card.GetAvailableLimit();
        }
        return totalLimit;
    }

    public decimal GetTotalAssetValue() => Balance;
}