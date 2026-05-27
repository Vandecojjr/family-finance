using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionDescriptionTooLongException : DomainException
{
    public TransactionDescriptionTooLongException() 
        : base("A descrição da transação deve ter no máximo 100 caracteres.")
    {
    }
}
