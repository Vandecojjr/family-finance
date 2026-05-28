using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class InvalidLastFourDigitsException : DomainException
{
    public InvalidLastFourDigitsException() 
        : base("Os 4 últimos dígitos do cartão devem conter exatamente 4 números.")
    {
    }
}
