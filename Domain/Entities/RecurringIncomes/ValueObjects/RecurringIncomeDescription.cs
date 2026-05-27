using Domain.Shared.Entities;
using Domain.Entities.RecurringIncomes.Exceptions;

namespace Domain.Entities.RecurringIncomes.ValueObjects;

public sealed record RecurringIncomeDescription : ValueObject
{
    public string Value { get; }

    private RecurringIncomeDescription(string value)
    {
        Value = value;
    }

    public static RecurringIncomeDescription Create(string value)
    {
        if (value is null)
            throw new DescriptionRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new DescriptionRequiredException();

        if (value.Length > 200)
            throw new DescriptionTooLongException();

        return new RecurringIncomeDescription(value.Trim());
    }
}
