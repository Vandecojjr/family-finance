using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class EmailInvalidException : DomainException
{
    public EmailInvalidException() 
        : base("O e-mail informado é inválido.")
    {
    }
}
