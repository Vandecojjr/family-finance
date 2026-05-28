using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class CreditCardBrandTooLongException : DomainException
{
    public CreditCardBrandTooLongException() 
        : base("A bandeira do cartão deve ter no máximo 50 caracteres.")
    {
    }
}
