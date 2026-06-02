using Domain.Shared.Exceptions;

namespace Domain.Entities.Incomes.Exceptions;

public class IncomeAmountException : DomainException
{
    public IncomeAmountException(string message) : base(message) { }
}
