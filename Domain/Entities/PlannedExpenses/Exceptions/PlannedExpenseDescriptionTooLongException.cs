using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedExpenses.Exceptions;

public class PlannedExpenseDescriptionTooLongException : DomainException
{
    public PlannedExpenseDescriptionTooLongException() 
        : base("A descrição do gasto planejado deve ter no máximo 200 caracteres.")
    {
    }
}
