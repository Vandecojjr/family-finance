using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class AccountAlreadyLinkedException : DomainException
{
    public AccountAlreadyLinkedException() 
        : base("Account já está vinculada a um Member.")
    {
    }
}
