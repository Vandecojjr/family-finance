using Domain.Shared.Entities;
using Domain.Entities.Transactions.Exceptions;

namespace Domain.Entities.Transactions.ValueObjects;

public sealed record TransactionAmount : ValueObject
{
    public decimal Value { get; }

    private TransactionAmount(decimal value)
    {
        Value = value;
    }

    public static TransactionAmount Create(decimal value)
    {
        if (value <= 0)
            throw new InvalidTransactionAmountException();

        return new TransactionAmount(value);
    }
}
