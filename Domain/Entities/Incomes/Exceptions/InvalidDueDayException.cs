using Domain.Shared.Exceptions;

namespace Domain.Entities.Incomes.Exceptions;

public class InvalidDueDayException : DomainException
{
    public InvalidDueDayException(string message) : base(message) { }
}
