using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class InvalidInvoiceAmountException : DomainException
{
    public InvalidInvoiceAmountException() 
        : base("O valor da fatura deve ser maior que zero.")
    {
    }
}
