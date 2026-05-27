using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedExpenses.Exceptions;

public class PlannedExpenseDescriptionRequiredException : DomainException
{
    public PlannedExpenseDescriptionRequiredException() 
        : base("A descrição do gasto planejado é obrigatória.")
    {
    }
}
