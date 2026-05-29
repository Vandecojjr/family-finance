using Domain.Shared.Exceptions;

namespace Domain.Entities.Expenses.Exceptions;

public class InvalidDueDayException : DomainException
{
    public InvalidDueDayException(string message) : base(message) { }
}
