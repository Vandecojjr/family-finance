using Domain.Shared.Exceptions;

namespace Domain.Entities.Expenses.Exceptions;

public class InvalidRecurringPeriodException : DomainException
{
    public InvalidRecurringPeriodException(string message) : base(message) { }
}
