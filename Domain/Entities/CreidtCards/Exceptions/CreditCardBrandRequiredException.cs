using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class CreditCardBrandRequiredException : DomainException
{
    public CreditCardBrandRequiredException() 
        : base("A bandeira do cartão é obrigatória.")
    {
    }
}
