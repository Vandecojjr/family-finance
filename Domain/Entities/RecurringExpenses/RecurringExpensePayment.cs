using Domain.Shared.Entities;

namespace Domain.Entities.RecurringExpenses;

public class RecurringExpensePayment : Entity
{
    public Guid RecurringExpenseId { get; private set; }
    public int Month { get; private set; }
    public int Year { get; private set; }
    public decimal AmountPaid { get; private set; }
    public DateTime PaidAt { get; private set; }

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected RecurringExpensePayment()
    {
    }
    #pragma warning restore CS8618

    internal RecurringExpensePayment(Guid recurringExpenseId, int month, int year, decimal amountPaid, DateTime paidAt)
    {
        if (month < 1 || month > 12)
            throw new ArgumentOutOfRangeException(nameof(month), "O mês deve estar entre 1 e 12.");

        if (year < 1)
            throw new ArgumentOutOfRangeException(nameof(year), "O ano deve ser maior que zero.");

        if (amountPaid <= 0)
            throw new ArgumentException("O valor pago deve ser maior que zero.", nameof(amountPaid));

        RecurringExpenseId = recurringExpenseId;
        Month = month;
        Year = year;
        AmountPaid = amountPaid;
        PaidAt = paidAt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(paidAt, DateTimeKind.Utc)
            : paidAt.ToUniversalTime();
    }
}
