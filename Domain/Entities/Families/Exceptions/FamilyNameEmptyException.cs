using Domain.Shared.Exceptions;

namespace Domain.Entities.Families.Exceptions;

public class FamilyNameEmptyException : DomainException
{
    public FamilyNameEmptyException() 
        : base("Family name cannot be empty.")
    {
    }
}
