using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class PasswordHashEmptyException : DomainException
{
    public PasswordHashEmptyException() 
        : base("O hash da senha não pode ser vazio.")
    {
    }
}
