using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionDescriptionRequiredException : DomainException
{
    public TransactionDescriptionRequiredException() 
        : base("A descrição da transação é obrigatória.")
    {
    }
}
