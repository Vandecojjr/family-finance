using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record BankName : ValueObject
{
    public string Value { get; }

    private BankName(string value)
    {
        Value = value;
    }

    public static BankName Create(string value)
    {
        if (value is null)
            throw new BankNameRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new BankNameRequiredException();

        if (value.Length > 100)
            throw new BankNameTooLongException();

        return new BankName(value.Trim());
    }
}
