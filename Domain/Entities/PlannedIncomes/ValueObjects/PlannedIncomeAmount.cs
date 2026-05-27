using Domain.Shared.Entities;
using Domain.Entities.PlannedIncomes.Exceptions;

namespace Domain.Entities.PlannedIncomes.ValueObjects;

public sealed record PlannedIncomeAmount : ValueObject
{
    public decimal Value { get; }

    private PlannedIncomeAmount(decimal value)
    {
        Value = value;
    }

    public static PlannedIncomeAmount Create(decimal value)
    {
        if (value < 0)
            throw new InvalidPlannedIncomeAmountException();

        return new PlannedIncomeAmount(value);
    }
}
