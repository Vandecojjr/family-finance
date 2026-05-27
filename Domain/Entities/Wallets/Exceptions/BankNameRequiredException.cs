using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class BankNameRequiredException : DomainException
{
    public BankNameRequiredException() 
        : base("O nome do banco é obrigatório.")
    {
    }
}
