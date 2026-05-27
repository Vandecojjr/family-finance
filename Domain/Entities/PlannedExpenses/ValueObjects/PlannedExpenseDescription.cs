using Domain.Shared.Entities;
using Domain.Entities.PlannedExpenses.Exceptions;

namespace Domain.Entities.PlannedExpenses.ValueObjects;

public sealed record PlannedExpenseDescription : ValueObject
{
    public string Value { get; }

    private PlannedExpenseDescription(string value)
    {
        Value = value;
    }

    public static PlannedExpenseDescription Create(string value)
    {
        if (value is null)
            throw new PlannedExpenseDescriptionRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new PlannedExpenseDescriptionRequiredException();

        if (value.Length > 200)
            throw new PlannedExpenseDescriptionTooLongException();

        return new PlannedExpenseDescription(value.Trim());
    }
}
