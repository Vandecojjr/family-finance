using Domain.Shared.Entities;
using Domain.Entities.Transactions.Exceptions;

namespace Domain.Entities.Transactions.ValueObjects;

public sealed record TransactionDescription : ValueObject
{
    public string Value { get; }

    private TransactionDescription(string value)
    {
        Value = value;
    }

    public static TransactionDescription Create(string value)
    {
        if (value is null)
            throw new TransactionDescriptionRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new TransactionDescriptionRequiredException();

        if (value.Length > 100)
            throw new TransactionDescriptionTooLongException();

        return new TransactionDescription(value.Trim());
    }
}
