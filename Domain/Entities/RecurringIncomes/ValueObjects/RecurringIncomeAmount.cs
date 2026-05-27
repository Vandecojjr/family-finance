using Domain.Shared.Entities;
using Domain.Entities.RecurringIncomes.Exceptions;

namespace Domain.Entities.RecurringIncomes.ValueObjects;

public sealed record RecurringIncomeAmount : ValueObject
{
    public decimal Value { get; }

    private RecurringIncomeAmount(decimal value)
    {
        Value = value;
    }

    public static RecurringIncomeAmount Create(decimal value)
    {
        if (value < 0)
            throw new InvalidAmountException();

        return new RecurringIncomeAmount(value);
    }
}
