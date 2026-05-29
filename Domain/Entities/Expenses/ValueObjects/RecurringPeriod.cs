using Domain.Shared.Entities;
using Domain.Entities.Expenses.Exceptions;

namespace Domain.Entities.Expenses.ValueObjects;

public sealed record RecurringPeriod : ValueObject
{
    public DateTime StartDate { get; }
    public DateTime? EndDate { get; }

    private RecurringPeriod(DateTime startDate, DateTime? endDate)
    {
        StartDate = startDate;
        EndDate = endDate;
    }

    public static RecurringPeriod Create(DateTime startDate, DateTime? endDate)
    {
        var utcStartDate = startDate.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(startDate, DateTimeKind.Utc) 
            : startDate.ToUniversalTime();

        var utcEndDate = endDate.HasValue 
            ? (endDate.Value.Kind == DateTimeKind.Unspecified 
                ? DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc) 
                : endDate.Value.ToUniversalTime()) 
            : (DateTime?)null;

        if (utcEndDate.HasValue && utcEndDate.Value < utcStartDate)
            throw new InvalidRecurringPeriodException("A data de término do gasto recorrente deve ser posterior ou igual à data de início.");

        return new RecurringPeriod(utcStartDate, utcEndDate);
    }
}
