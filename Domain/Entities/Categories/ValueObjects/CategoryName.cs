using Domain.Shared.Entities;
using Domain.Entities.Categories.Exceptions;

namespace Domain.Entities.Categories.ValueObjects;

public sealed record CategoryName : ValueObject
{
    public string Value { get; init; }

    private CategoryName(string value)
    {
        Value = value;
    }

    public static CategoryName Create(string value)
    {
        if (value is null)
            throw new CategoryNameRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new CategoryNameEmptyException();

        if (value.Length > 100)
            throw new CategoryNameTooLongException();

        return new CategoryName(value);
    }
}
