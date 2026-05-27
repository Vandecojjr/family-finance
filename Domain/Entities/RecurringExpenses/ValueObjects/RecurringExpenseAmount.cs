using Domain.Shared.Entities;
using Domain.Entities.RecurringExpenses.Exceptions;

namespace Domain.Entities.RecurringExpenses.ValueObjects;

public sealed record RecurringExpenseAmount : ValueObject
{
    public decimal Value { get; }

    private RecurringExpenseAmount(decimal value)
    {
        Value = value;
    }

    public static RecurringExpenseAmount Create(decimal value)
    {
        if (value < 0)
            throw new InvalidAmountException();

        return new RecurringExpenseAmount(value);
    }
}
