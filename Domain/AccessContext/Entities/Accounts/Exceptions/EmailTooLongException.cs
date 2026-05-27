using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class EmailTooLongException : DomainException
{
    public EmailTooLongException() 
        : base("O e-mail não pode ter mais de 256 caracteres.")
    {
    }
}
