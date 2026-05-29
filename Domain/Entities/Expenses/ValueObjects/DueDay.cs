using Domain.Shared.Entities;
using Domain.Entities.Expenses.Exceptions;

namespace Domain.Entities.Expenses.ValueObjects;

public sealed record DueDay : ValueObject
{
    public int Value { get; init; }

    private DueDay(int value)
    {
        Value = value;
    }

    public static DueDay Create(int value)
    {
        if (value < 1 || value > 31)
            throw new InvalidDueDayException("O dia de vencimento deve estar entre 1 e 31.");

        return new DueDay(value);
    }
    
    public static implicit operator int(DueDay dueDay) => dueDay.Value;
}
