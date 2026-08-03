using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class InvalidInvoiceDueDateException : DomainException
{
    public InvalidInvoiceDueDateException() 
        : base("A data de vencimento não pode ser vazia.")
    {
    }
}
