using Domain.Shared.Exceptions;

namespace Domain.Entities.Incomes.Exceptions;

public class IncomeDescriptionTooLongException : DomainException
{
    public IncomeDescriptionTooLongException(string message) : base(message) { }
}
