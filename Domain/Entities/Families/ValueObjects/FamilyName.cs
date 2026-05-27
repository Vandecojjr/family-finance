using Domain.Shared.Entities;
using Domain.Entities.Families.Exceptions;

namespace Domain.Entities.Families.ValueObjects;

public sealed record FamilyName : ValueObject
{
    public string Value { get; }

    private FamilyName(string value)
    {
        Value = value;
    }

    public static FamilyName Create(string value)
    {
        if (value is null)
            throw new FamilyNameRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new FamilyNameEmptyException();

        if (value.Length > 100)
            throw new FamilyNameTooLongException();

        return new FamilyName(value);
    }
}
