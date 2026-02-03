using Domain.Enums;

namespace Application.Categories.Dtos;

public record CategoryResponseDto(
    Guid Id,
    string Name,
    CategoryType Type,
    string Icon,
    string Color,
    Guid? ParentId,
    bool IsCustom, // True if FamilyId is not null
    List<CategoryResponseDto> SubCategories
);
