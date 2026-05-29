using Domain.Shared.Entities;

namespace Domain.Entities.Expenses;

public class ExpensePayment : Entity
{
    public Guid ExpenseId { get; private set; }
    public int Month { get; private set; }
    public int Year { get; private set; }
    public decimal AmountPaid { get; private set; }
    public DateTime PaidAt { get; private set; }

    #pragma warning disable CS8618
    protected ExpensePayment() { }
    #pragma warning restore CS8618

    internal ExpensePayment(Guid expenseId, int month, int year, decimal amountPaid, DateTime paidAt)
    {
        if (month < 1 || month > 12) throw new ArgumentOutOfRangeException(nameof(month));
        if (year < 1) throw new ArgumentOutOfRangeException(nameof(year));
        if (amountPaid <= 0) throw new ArgumentException("O valor pago deve ser maior que zero.", nameof(amountPaid));

        ExpenseId = expenseId;
        Month = month;
        Year = year;
        AmountPaid = amountPaid;
        PaidAt = paidAt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(paidAt, DateTimeKind.Utc)
            : paidAt.ToUniversalTime();
    }
}
