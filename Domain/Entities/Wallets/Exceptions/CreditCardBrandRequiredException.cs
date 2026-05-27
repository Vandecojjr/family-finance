using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class CreditCardBrandRequiredException : DomainException
{
    public CreditCardBrandRequiredException() 
        : base("A bandeira do cartão é obrigatória.")
    {
    }
}
