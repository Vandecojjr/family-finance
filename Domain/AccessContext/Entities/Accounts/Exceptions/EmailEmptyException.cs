using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class EmailEmptyException : DomainException
{
    public EmailEmptyException() 
        : base("O e-mail não pode ser vazio.")
    {
    }
}
