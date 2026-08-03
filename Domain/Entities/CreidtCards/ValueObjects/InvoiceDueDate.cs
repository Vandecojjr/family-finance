using Domain.Entities.CreidtCards.Exceptions;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards.ValueObjects;

public sealed record InvoiceDueDate : ValueObject
{
    public DateTime Value { get; }

    private InvoiceDueDate(DateTime value)
    {
        Value = value;
    }

    public static InvoiceDueDate Create(DateTime value)
    {
        if (value == default)
            throw new InvalidInvoiceDueDateException();

        return new InvoiceDueDate(value);
    }
}
