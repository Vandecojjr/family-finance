using Domain.Shared.Exceptions;

namespace Domain.Entities.Members.Exceptions;

public class MemberNameTooLongException : DomainException
{
    public MemberNameTooLongException() 
        : base("Member name cannot exceed 100 characters.")
    {
    }
}
