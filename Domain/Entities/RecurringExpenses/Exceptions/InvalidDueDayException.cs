using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringExpenses.Exceptions;

public class InvalidDueDayException : DomainException
{
    public InvalidDueDayException() 
        : base("O dia de vencimento do gasto recorrente deve estar entre 1 e 31.")
    {
    }
}
