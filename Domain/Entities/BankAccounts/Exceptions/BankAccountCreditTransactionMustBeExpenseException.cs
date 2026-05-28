using Domain.Shared.Exceptions;

namespace Domain.Entities.BankAccounts.Exceptions;

public class BankAccountCreditTransactionMustBeExpenseException : DomainException
{
    public BankAccountCreditTransactionMustBeExpenseException() 
        : base("Apenas transações do tipo Despesa são permitidas para limite de crédito da conta bancária.")
    {
    }
}
