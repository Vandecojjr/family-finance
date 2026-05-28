using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionNotesTooLongException : DomainException
{
    public TransactionNotesTooLongException() 
        : base("As observações da transação devem ter no máximo 500 caracteres.")
    {
    }
}
