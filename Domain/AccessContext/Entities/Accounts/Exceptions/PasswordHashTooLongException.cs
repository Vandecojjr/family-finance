using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class PasswordHashTooLongException : DomainException
{
    public PasswordHashTooLongException() 
        : base("O hash da senha não pode ter mais de 500 caracteres.")
    {
    }
}
