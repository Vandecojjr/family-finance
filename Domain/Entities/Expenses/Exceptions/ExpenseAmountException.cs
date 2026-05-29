using Domain.Shared.Exceptions;

namespace Domain.Entities.Expenses.Exceptions;

public class ExpenseAmountException : DomainException
{
    public ExpenseAmountException(string message) : base(message) { }
}
