using Domain.Shared.Exceptions;

namespace Domain.Entities.RecurringExpenses.Exceptions;

public class DescriptionRequiredException : DomainException
{
    public DescriptionRequiredException() 
        : base("A descrição do gasto recorrente é obrigatória.")
    {
    }
}
