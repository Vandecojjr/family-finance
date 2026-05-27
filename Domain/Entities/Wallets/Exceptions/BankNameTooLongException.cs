using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class BankNameTooLongException : DomainException
{
    public BankNameTooLongException() 
        : base("O nome do banco deve ter no máximo 100 caracteres.")
    {
    }
}
