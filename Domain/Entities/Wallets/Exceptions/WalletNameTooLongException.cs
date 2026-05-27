using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class WalletNameTooLongException : DomainException
{
    public WalletNameTooLongException() 
        : base("O nome da carteira deve ter no máximo 100 caracteres.")
    {
    }
}
