using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record CreditLimit : ValueObject
{
    public decimal Value { get; }

    private CreditLimit(decimal value)
    {
        Value = value;
    }

    public static CreditLimit Create(decimal value)
    {
        if (value < 0)
            throw new InvalidCreditLimitException();

        return new CreditLimit(value);
    }
}
