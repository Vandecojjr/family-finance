using Domain.Shared.Exceptions;

namespace Domain.Entities.Members.Exceptions;

public class MemberNameRequiredException : DomainException
{
    public MemberNameRequiredException() 
        : base("Member name is required and cannot be null.")
    {
    }
}
