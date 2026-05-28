using Domain.Entities.BankAccounts.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.BankAccounts.ValueObjects;

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
