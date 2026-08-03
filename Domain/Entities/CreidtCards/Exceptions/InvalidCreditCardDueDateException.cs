using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class InvalidCreditCardDueDateException : DomainException
{
    public InvalidCreditCardDueDateException() 
        : base("O dia de vencimento do cartão deve ser entre 1 e 31.")
    {
    }
}
