using Domain.Shared.Exceptions;

namespace Domain.AccessContext.Entities.Accounts.Exceptions;

public class RefreshTokenValueEmptyException : DomainException
{
    public RefreshTokenValueEmptyException() 
        : base("O token de refresh não pode ser vazio.")
    {
    }
}
