using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringExpenses.Exceptions;

public class InvalidPeriodException : DomainException
{
    public InvalidPeriodException() 
        : base("A data de término do período deve ser igual ou posterior à data de início.")
    {
    }
}
