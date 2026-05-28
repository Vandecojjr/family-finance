using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionWalletNameTooLongException : DomainException
{
    public TransactionWalletNameTooLongException() 
        : base("O nome da carteira na transação deve ter no máximo 100 caracteres.")
    {
    }
}
