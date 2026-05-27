using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class InvalidTransactionAmountException : DomainException
{
    public InvalidTransactionAmountException() 
        : base("O valor da transação deve ser maior que zero.")
    {
    }
}
