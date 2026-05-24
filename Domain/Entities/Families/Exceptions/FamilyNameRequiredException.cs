using Domain.Shared.Exceptions;

namespace Domain.Entities.Families.Exceptions;

public class FamilyNameRequiredException : DomainException
{
    public FamilyNameRequiredException() 
        : base("Family name is required and cannot be null.")
    {
    }
}
