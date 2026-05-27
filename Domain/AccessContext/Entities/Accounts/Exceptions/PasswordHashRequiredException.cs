using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class PasswordHashRequiredException : DomainException
{
    public PasswordHashRequiredException() 
        : base("O hash da senha é obrigatório.")
    {
    }
}
