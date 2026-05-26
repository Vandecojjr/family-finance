using Domain.Entities.Categories;
using Domain.Enums;

namespace Application.Categories.UseCases.ListCategories;

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
            category.Name.Value,
            category.Type,
            category.FamilyId,
            category.ParentId,
            category.SubCategories.Select(ToResponse).ToList().AsReadOnly());
    }

    public static IReadOnlyCollection<CategoryResponse> MapToHierarchy(this IEnumerable<Category> categories)
    {
        var allCategories = categories.ToList();

        // 1. Obter apenas categorias principais (sem ParentId)
        var topLevelCategories = allCategories
            .Where(c => c.ParentId == null)
            .ToList();

        // 2. Mapear cada categoria principal associando suas subcategorias da lista já carregada
        return topLevelCategories.Select(parent => new CategoryResponse(
            parent.Id,
            parent.Name.Value,
            parent.Type,
            parent.FamilyId,
            parent.ParentId,
            allCategories
                .Where(sub => sub.ParentId == parent.Id)
                .Select(sub => sub.ToResponse())
                .ToList()
                .AsReadOnly()
        )).ToList().AsReadOnly();
    }
}
