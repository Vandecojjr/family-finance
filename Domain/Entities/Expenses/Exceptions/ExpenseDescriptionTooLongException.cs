using Domain.Shared.Exceptions;

namespace Domain.Entities.Expenses.Exceptions;

public class ExpenseDescriptionTooLongException : DomainException
{
    public ExpenseDescriptionTooLongException(string message) : base(message) { }
}
