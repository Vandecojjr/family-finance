using Domain.Shared.Entities;

namespace Domain.Entities.Incomes;

public class IncomePayment : Entity
{
    public Guid IncomeId { get; private set; }
    public int Month { get; private set; }
    public int Year { get; private set; }
    public decimal AmountReceived { get; private set; }
    public DateTime ReceivedAt { get; private set; }

    #pragma warning disable CS8618
    protected IncomePayment() { }
    #pragma warning restore CS8618

    internal IncomePayment(Guid incomeId, int month, int year, decimal amountReceived, DateTime receivedAt)
    {
        if (month < 1 || month > 12) throw new ArgumentOutOfRangeException(nameof(month));
        if (year < 1) throw new ArgumentOutOfRangeException(nameof(year));
        if (amountReceived <= 0) throw new ArgumentException("O valor recebido deve ser maior que zero.", nameof(amountReceived));

        IncomeId = incomeId;
        Month = month;
        Year = year;
        AmountReceived = amountReceived;
        ReceivedAt = receivedAt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(receivedAt, DateTimeKind.Utc)
            : receivedAt.ToUniversalTime();
    }
}
