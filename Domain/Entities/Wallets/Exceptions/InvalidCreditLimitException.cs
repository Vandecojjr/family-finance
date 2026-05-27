using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class InvalidCreditLimitException : DomainException
{
    public InvalidCreditLimitException() 
        : base("O limite de crédito deve ser maior ou igual a zero.")
    {
    }
}
