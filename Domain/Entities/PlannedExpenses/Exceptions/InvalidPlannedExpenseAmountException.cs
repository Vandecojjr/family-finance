using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedExpenses.Exceptions;

public class InvalidPlannedExpenseAmountException : DomainException
{
    public InvalidPlannedExpenseAmountException() 
        : base("O valor do gasto planejado deve ser maior ou igual a zero.")
    {
    }
}
