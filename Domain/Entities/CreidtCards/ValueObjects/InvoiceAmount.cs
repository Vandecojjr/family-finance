using Domain.Entities.CreidtCards.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards.ValueObjects;

public sealed record InvoiceAmount : ValueObject
{
    public decimal Value { get; }

    private InvoiceAmount(decimal value)
    {
        Value = value;
    }

    public static InvoiceAmount Create(decimal value)
    {
        if (value <= 0)
            throw new InvalidInvoiceAmountException();

        return new InvoiceAmount(value);
    }
}
