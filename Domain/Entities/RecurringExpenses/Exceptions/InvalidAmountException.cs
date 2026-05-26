using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringExpenses.Exceptions;

public class InvalidAmountException : DomainException
{
    public InvalidAmountException() 
        : base("O valor estimado do gasto recorrente deve ser maior ou igual a zero.")
    {
    }
}
