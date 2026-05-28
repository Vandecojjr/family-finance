using Domain.Shared.Exceptions;

namespace Domain.Entities.BankAccounts.Exceptions;

public class BankAccountTransactionMustSelectSourceException : DomainException
{
    public BankAccountTransactionMustSelectSourceException() 
        : base("Deve-se escolher se a transação da conta bancária será do saldo ou do crédito.")
    {
    }
}
