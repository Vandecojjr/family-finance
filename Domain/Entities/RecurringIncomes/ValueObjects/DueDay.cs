using Domain.Shared.Entities;
using Domain.Entities.RecurringIncomes.Exceptions;

namespace Domain.Entities.RecurringIncomes.ValueObjects;

public sealed record DueDay : ValueObject
{
    public int Value { get; init; }

    private DueDay(int value)
    {
        Value = value;
    }

    public static DueDay Create(int value)
    {
        if (!((value >= 1 && value <= 31) || (value >= 101 && value <= 131)))
            throw new InvalidDueDayException();

        return new DueDay(value);
    }
}
