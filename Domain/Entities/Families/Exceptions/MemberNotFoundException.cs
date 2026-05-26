using Domain.Shared.Exceptions;

namespace Domain.Entities.Families.Exceptions;

public class MemberNotFoundException : DomainException
{
    public MemberNotFoundException(Guid memberId) 
        : base($"Member with ID {memberId} was not found in this family.")
    {
    }
}
