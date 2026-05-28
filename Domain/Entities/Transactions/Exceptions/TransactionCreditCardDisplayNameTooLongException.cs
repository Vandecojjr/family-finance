using Domain.Shared.Exceptions;

namespace Domain.Entities.Transactions.Exceptions;

public class TransactionCreditCardDisplayNameTooLongException : DomainException
{
    public TransactionCreditCardDisplayNameTooLongException() 
        : base("O nome de exibição do cartão de crédito na transação deve ter no máximo 150 caracteres.")
    {
    }
}
