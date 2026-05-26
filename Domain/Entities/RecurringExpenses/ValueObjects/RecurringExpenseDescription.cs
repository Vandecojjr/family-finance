using Domain.Shared.Entities;
using Domain.Entities.RecurringExpenses.Exceptions;

namespace Domain.Entities.RecurringExpenses.ValueObjects;

public sealed record RecurringExpenseDescription : ValueObject
{
    public string Value { get; init; }

    private RecurringExpenseDescription(string value)
    {
        Value = value;
    }

    public static RecurringExpenseDescription Create(string value)
    {
        if (value is null)
            throw new DescriptionRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new DescriptionRequiredException();

        if (value.Length > 200)
            throw new DescriptionTooLongException();

        return new RecurringExpenseDescription(value.Trim());
    }
}
