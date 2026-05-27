using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class CreditCard : Entity
{
    public Guid BankAccountId { get; private set; }
    public string Brand { get; private set; } = null!;
    public string LastFourDigits { get; private set; } = null!;
    public decimal TotalLimit { get; private set; }

    public virtual BankAccount BankAccount { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected CreditCard()
    {
    }
    #pragma warning restore CS8618

    public CreditCard(string brand, string lastFourDigits, decimal totalLimit, Guid bankAccountId)
    {
        if (string.IsNullOrWhiteSpace(brand))
            throw new ArgumentException("A bandeira do cartão é obrigatória.", nameof(brand));
        if (brand.Length > 50)
            throw new ArgumentException("A bandeira do cartão deve ter no máximo 50 caracteres.", nameof(brand));
        if (string.IsNullOrWhiteSpace(lastFourDigits) || lastFourDigits.Length != 4 || !int.TryParse(lastFourDigits, out _))
            throw new ArgumentException("Os 4 últimos dígitos do cartão devem conter exatamente 4 números.", nameof(lastFourDigits));
        if (totalLimit < 0)
            throw new ArgumentException("O limite total deve ser maior ou igual a zero.", nameof(totalLimit));

        Brand = brand.Trim();
        LastFourDigits = lastFourDigits;
        TotalLimit = totalLimit;
        BankAccountId = bankAccountId;
    }
}
