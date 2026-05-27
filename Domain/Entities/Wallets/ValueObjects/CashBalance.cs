using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record CashBalance : ValueObject
{
    public decimal Value { get; }

    private CashBalance(decimal value)
    {
        Value = value;
    }

    public static CashBalance Create(decimal value)
    {
        if (value < 0)
            throw new InvalidCashBalanceException();

        return new CashBalance(value);
    }
}
