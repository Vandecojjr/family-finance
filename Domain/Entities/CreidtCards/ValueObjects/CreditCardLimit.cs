using Domain.Entities.CreidtCards.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards.ValueObjects;

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
