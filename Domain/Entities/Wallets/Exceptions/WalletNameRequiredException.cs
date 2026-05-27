using Domain.Shared.Exceptions;

namespace Domain.Entities.Wallets.Exceptions;

public class WalletNameRequiredException : DomainException
{
    public WalletNameRequiredException() 
        : base("O nome da carteira é obrigatório.")
    {
    }
}
