using Domain.Entities.Families;
using Domain.Entities.Members;

namespace Application.UseCases.Families.GetFamilyById;

public sealed record FamilyResponse(
    Guid Id,
    string Name,
    bool IsActive,
    IReadOnlyCollection<FamilyMemberResponse> Members);

public sealed record FamilyMemberResponse(
    Guid Id,
    string Name);


public static class FamilyResponseFactory
{
    public static FamilyResponse ToResponse(this Family family)
    {
        return new FamilyResponse(
            family.Id,
            family.Name.Value,
            family.Status.IsActive,
            family.Members.ToResponse());
    }
    
    public static FamilyMemberResponse ToResponse(this Member member)
    {
        return new FamilyMemberResponse(member.Id, member.Name.Value);
    }
    
    public static IReadOnlyCollection<FamilyMemberResponse> ToResponse(this IReadOnlyCollection<Member> members)
    {
        return members.Select(ToResponse).ToList();
    }
}
