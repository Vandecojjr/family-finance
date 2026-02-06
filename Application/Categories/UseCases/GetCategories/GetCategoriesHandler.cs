using Application.Categories.Dtos;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Categories;
using Domain.Repositories;
using Mediator;

namespace Application.Categories.UseCases.GetCategories;

public sealed class GetCategoriesHandler(
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : IQueryHandler<GetCategoriesQuery, Result<List<CategoryResponseDto>>>
{
    public async ValueTask<Result<List<CategoryResponseDto>>> Handle(GetCategoriesQuery query, CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
        {
            return Result<List<CategoryResponseDto>>.Failure(Error.None);
        }

        var allCategories = await categoryRepository.GetAllForFamilyAsync(family.Id, cancellationToken);
        var rootCategories = allCategories.Where(c => c.ParentId == null).ToList();
        var response = rootCategories.Select(root => MapToDto(root, allCategories)).ToList();

        return Result<List<CategoryResponseDto>>.Success(response);
    }

    private static CategoryResponseDto MapToDto(Category category, List<Category> allCategories)
    {
        var children = allCategories
            .Where(c => c.ParentId == category.Id)
            .Select(c => MapToDto(c, allCategories)) // Recursion
            .ToList();

        return new CategoryResponseDto(
            category.Id,
            category.Name,
            category.Type,
            category.ParentId,
            IsCustom: category.FamilyId != null,
            SubCategories: children
        );
    }
}
