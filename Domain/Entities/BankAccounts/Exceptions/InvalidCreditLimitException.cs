using Domain.Shared.Exceptions;

namespace Domain.Entities.BankAccounts.Exceptions;

public class InvalidCreditLimitException : DomainException
{
    public InvalidCreditLimitException() 
        : base("O limite de crédito deve ser maior ou igual a zero.")
    {
    }
}
