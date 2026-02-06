using Domain.Enums;

namespace Application.Categories.Dtos;

public record CategoryResponseDto(
    Guid Id,
    string Name,
    CategoryType Type,
    Guid? ParentId,
    bool IsCustom,
    List<CategoryResponseDto> SubCategories
);
