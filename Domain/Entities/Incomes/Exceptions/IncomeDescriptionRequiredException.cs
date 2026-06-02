using Domain.Shared.Exceptions;

namespace Domain.Entities.Incomes.Exceptions;

public class IncomeDescriptionRequiredException : DomainException
{
    public IncomeDescriptionRequiredException(string message) : base(message) { }
}
