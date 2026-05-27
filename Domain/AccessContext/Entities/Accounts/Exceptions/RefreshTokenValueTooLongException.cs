using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class RefreshTokenValueTooLongException : DomainException
{
    public RefreshTokenValueTooLongException() 
        : base("O token de refresh não pode ter mais de 500 caracteres.")
    {
    }
}
