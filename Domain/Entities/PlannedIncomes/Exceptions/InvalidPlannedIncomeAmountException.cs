using Domain.Shared.Exceptions;

namespace Domain.Entities.PlannedIncomes.Exceptions;

public class InvalidPlannedIncomeAmountException : DomainException
{
    public InvalidPlannedIncomeAmountException() 
        : base("O valor da receita planejada deve ser maior ou igual a zero.")
    {
    }
}
