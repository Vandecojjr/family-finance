using Domain.Shared.Entities;
using Domain.Entities.Wallets.Exceptions;

namespace Domain.Entities.Wallets.ValueObjects;

public sealed record CreditCardBrand : ValueObject
{
    public string Value { get; }

    private CreditCardBrand(string value)
    {
        Value = value;
    }

    public static CreditCardBrand Create(string value)
    {
        if (value is null)
            throw new CreditCardBrandRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new CreditCardBrandRequiredException();

        if (value.Length > 50)
            throw new CreditCardBrandTooLongException();

        return new CreditCardBrand(value.Trim());
    }
}
