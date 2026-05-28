using Domain.Entities.BankAccounts;
using Domain.Entities.BankAccounts.Exceptions;
using Domain.Entities.BankAccounts.ValueObjects;
using Domain.Entities.CreidtCards.ValueObjects;
using Domain.Entities.Wallets;
using Domain.Entities.Wallets.ValueObjects;
using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards;

public class CreditCard : Entity
{
    public Guid BankAccountId { get; private set; }
    public CreditCardBrand Brand { get; private set; } = null!;
    public LastFourDigits LastFourDigits { get; private set; } = null!;
    public CreditCardLimit TotalLimit { get; private set; } = null!;

    public virtual BankAccount BankAccount { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected CreditCard()
    {
    }
    #pragma warning restore CS8618

    public CreditCard(string brand, string lastFourDigits, decimal totalLimit, Guid bankAccountId)
    {
        Brand = CreditCardBrand.Create(brand);
        LastFourDigits = LastFourDigits.Create(lastFourDigits);
        TotalLimit = CreditCardLimit.Create(totalLimit);
        BankAccountId = bankAccountId;
    }

    public void AdjustBalance(decimal amount, TransactionType type)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));
        
        if (type == TransactionType.Income)
            throw new BankAccountCreditTransactionMustBeExpenseException();

        if (TotalLimit.Value < amount)
            throw new InvalidOperationException("Saldo e limite de crédito insuficientes para realizar esta transação.");
            
        TotalLimit = CreditCardLimit.Create(TotalLimit.Value - amount);
    }
}
