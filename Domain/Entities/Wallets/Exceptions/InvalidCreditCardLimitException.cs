using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class InvalidCreditCardLimitException : DomainException
{
    public InvalidCreditCardLimitException() 
        : base("O limite total deve ser maior ou igual a zero.")
    {
    }
}
