using Domain.Shared.Exceptions;

namespace Domain.Entities.Expenses.Exceptions;

public class ExpenseDescriptionRequiredException : DomainException
{
    public ExpenseDescriptionRequiredException(string message) : base(message) { }
}
