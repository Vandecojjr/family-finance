using Domain.Entities.Families.ValueObjects;

namespace Application.UseCases.Families.GetFamilyName;

public sealed record FamilyNameResponse(string Name);

public static class FamilyNameResponseFactory
{
    public static FamilyNameResponse ToResponse(this FamilyName familyName)
    {
        return new FamilyNameResponse(familyName.Value);
    }
}
