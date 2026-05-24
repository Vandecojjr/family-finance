using Domain.Shared.Entities;

namespace Domain.Entities.Families.ValueObjects;

public sealed record FamilyStatus : ValueObject
{
    public bool IsActive { get; init; }

    private FamilyStatus(bool isActive)
    {
        IsActive = isActive;
    }

    public static FamilyStatus Active => new(true);
    public static FamilyStatus Inactive => new(false);
}
