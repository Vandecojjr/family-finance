using Domain.Shared.Exceptions;

namespace Domain.Entities.BankAccounts.Exceptions;

public class BankNameRequiredException : DomainException
{
    public BankNameRequiredException() 
        : base("O nome do banco é obrigatório.")
    {
    }
}
