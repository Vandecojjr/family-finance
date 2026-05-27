using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedIncomes.Exceptions;

public class PlannedIncomeDescriptionRequiredException : DomainException
{
    public PlannedIncomeDescriptionRequiredException() 
        : base("A descrição da receita planejada é obrigatória.")
    {
    }
}
