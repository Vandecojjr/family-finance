using Domain.Shared.Entities;
using Domain.Entities.Categories.Exceptions;

namespace Domain.Entities.Categories.ValueObjects;

public sealed record CategoryName : ValueObject
{
    public string Value { get;}

    private CategoryName(string value)
    {
        Value = value;
    }

    public static CategoryName Create(string value)
    {
        if (string.IsNullOrEmpty(value) || string.IsNullOrWhiteSpace(value))
            throw new CategoryNameEmptyException();

        if (value.Length > 100)
            throw new CategoryNameTooLongException();

        return new CategoryName(value);
    }
    
    public static implicit operator string(CategoryName categoryName) => categoryName.Value;
}
