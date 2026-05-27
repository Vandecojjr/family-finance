using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class EmailRequiredException : DomainException
{
    public EmailRequiredException() 
        : base("O e-mail é obrigatório.")
    {
    }
}
