using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringIncomes.Exceptions;

public class InvalidPeriodException : DomainException
{
    public InvalidPeriodException() 
        : base("A data de término do ganho recorrente deve ser posterior ou igual à data de início.")
    {
    }
}
