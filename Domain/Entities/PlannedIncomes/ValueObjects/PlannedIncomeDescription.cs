using Domain.Shared.Entities;
using Domain.Entities.PlannedIncomes.Exceptions;

namespace Domain.Entities.PlannedIncomes.ValueObjects;

public sealed record PlannedIncomeDescription : ValueObject
{
    public string Value { get; }

    private PlannedIncomeDescription(string value)
    {
        Value = value;
    }

    public static PlannedIncomeDescription Create(string value)
    {
        if (value is null)
            throw new PlannedIncomeDescriptionRequiredException();

        if (string.IsNullOrWhiteSpace(value))
            throw new PlannedIncomeDescriptionRequiredException();

        if (value.Length > 200)
            throw new PlannedIncomeDescriptionTooLongException();

        return new PlannedIncomeDescription(value.Trim());
    }
}
