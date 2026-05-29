using Domain.Shared.Entities;
using Domain.Entities.Expenses.Exceptions;

namespace Domain.Entities.Expenses.ValueObjects;

public sealed record ExpenseAmount : ValueObject
{
    public decimal Value { get; init; }

    private ExpenseAmount(decimal value) => Value = value;

    public static ExpenseAmount Create(decimal value)
    {
        if (value <= 0)
            throw new ExpenseAmountException("O valor deve ser maior que zero.");

        return new ExpenseAmount(value);
    }
}
