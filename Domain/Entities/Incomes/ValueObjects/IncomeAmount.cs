using Domain.Shared.Entities;
using Domain.Entities.Incomes.Exceptions;

namespace Domain.Entities.Incomes.ValueObjects;

public sealed record IncomeAmount : ValueObject
{
    public decimal Value { get; init; }

    private IncomeAmount(decimal value) => Value = value;

    public static IncomeAmount Create(decimal value)
    {
        if (value <= 0)
            throw new IncomeAmountException("O valor deve ser maior que zero.");

        return new IncomeAmount(value);
    }
}
