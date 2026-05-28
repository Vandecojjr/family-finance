using Domain.Shared.Exceptions;

namespace Domain.Entities.CreidtCards.Exceptions;

public class CreditCardTransactionMustBeExpenseException : DomainException
{
    public CreditCardTransactionMustBeExpenseException() 
        : base("Apenas transações do tipo Despesa são permitidas para cartão de crédito.")
    {
    }
}
