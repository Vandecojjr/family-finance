using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class InvalidCashBalanceException : DomainException
{
    public InvalidCashBalanceException() 
        : base("O saldo em dinheiro vivo deve ser maior ou igual a zero.")
    {
    }
}
