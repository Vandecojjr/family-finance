using Domain.Shared.Exceptions;

namespace Domain.Entities.Families.Exceptions;

public class FamilyNameTooLongException : DomainException
{
    public FamilyNameTooLongException() 
        : base("Family name cannot exceed 100 characters.")
    {
    }
}
