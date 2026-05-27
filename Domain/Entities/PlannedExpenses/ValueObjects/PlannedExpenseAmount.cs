using Domain.Shared.Entities;
using Domain.Entities.PlannedExpenses.Exceptions;

namespace Domain.Entities.PlannedExpenses.ValueObjects;

public sealed record PlannedExpenseAmount : ValueObject
{
    public decimal Value { get; }

    private PlannedExpenseAmount(decimal value)
    {
        Value = value;
    }

    public static PlannedExpenseAmount Create(decimal value)
    {
        if (value < 0)
            throw new InvalidPlannedExpenseAmountException();

        return new PlannedExpenseAmount(value);
    }
}
