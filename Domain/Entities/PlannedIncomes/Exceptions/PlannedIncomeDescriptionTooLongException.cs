using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedIncomes.Exceptions;

public class PlannedIncomeDescriptionTooLongException : DomainException
{
    public PlannedIncomeDescriptionTooLongException() 
        : base("A descrição da receita planejada deve ter no máximo 200 caracteres.")
    {
    }
}
