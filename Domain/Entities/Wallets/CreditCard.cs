using Domain.Shared.Entities;
using Domain.Entities.Wallets.ValueObjects;

namespace Domain.Entities.Wallets;

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
}
