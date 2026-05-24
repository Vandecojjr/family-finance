using Domain.Shared.Exceptions;

namespace Domain.Entities.Members.Exceptions;

public class MemberNameEmptyException : DomainException
{
    public MemberNameEmptyException() 
        : base("Member name cannot be empty.")
    {
    }
}
