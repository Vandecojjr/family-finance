using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionBankAccountNameTooLongException : DomainException
{
    public TransactionBankAccountNameTooLongException() 
        : base("O nome da conta bancária na transação deve ter no máximo 100 caracteres.")
    {
    }
}
