using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class InvalidCreditCardInvoicesException : DomainException
{
    public InvalidCreditCardInvoicesException(string message) 
        : base(message)
    {
    }
}
