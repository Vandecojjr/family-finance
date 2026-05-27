using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class RefreshTokenValueRequiredException : DomainException
{
    public RefreshTokenValueRequiredException() 
        : base("O token de refresh é obrigatório.")
    {
    }
}
