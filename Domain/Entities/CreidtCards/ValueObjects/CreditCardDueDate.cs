using Domain.Entities.CreidtCards.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards.ValueObjects;

public sealed record CreditCardDueDate : ValueObject
{
    public int Value { get; }

    private CreditCardDueDate(int value)
    {
        Value = value;
    }

    public static CreditCardDueDate Create(int value)
    {
        if (value < 1 || value > 31)
            throw new InvalidCreditCardDueDateException();

        return new CreditCardDueDate(value);
    }
}
