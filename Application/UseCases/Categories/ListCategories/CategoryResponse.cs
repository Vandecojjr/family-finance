using Domain.Entities.Categories;
using Domain.Enums;

namespace Application.UseCases.Categories.ListCategories;

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    CategoryType Type,
    Guid FamilyId,
    Guid? ParentId,
    IReadOnlyCollection<CategoryResponse> SubCategories);

public static class CategoryResponseFactory
{
    public static CategoryResponse ToResponse(this Category category)
    {
        return new CategoryResponse(
            category.Id,
            category.Name,
            category.Type,
            category.FamilyId,
            category.ParentId,
            category.SubCategories.Select(ToResponse).ToList().AsReadOnly());
    }
    
    public static IReadOnlyCollection<CategoryResponse> ToResponse(this IReadOnlyCollection<Category> categories)
    {
        return categories.Select(ToResponse).ToList();
    }
}

