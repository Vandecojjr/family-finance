using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record CreditCardLimit : ValueObject
{
    public decimal Value { get; }

    private CreditCardLimit(decimal value)
    {
        Value = value;
    }

    public static CreditCardLimit Create(decimal value)
    {
        if (value < 0)
            throw new InvalidCreditCardLimitException();

        return new CreditCardLimit(value);
    }
}
