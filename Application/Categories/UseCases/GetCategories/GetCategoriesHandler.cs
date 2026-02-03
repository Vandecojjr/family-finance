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
        // 1. Get Family ID
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
        {
            return Result<List<CategoryResponseDto>>.Failure("User is not associated with any family.");
        }

        // 2. Fetch All Categories (System + Family)
        var allCategories = await categoryRepository.GetAllForFamilyAsync(family.Id, cancellationToken);

        // 3. Build Tree
        // Filter roots (ParentId is null)
        var rootCategories = allCategories.Where(c => c.ParentId == null).ToList();

        var response = rootCategories.Select(root => MapToDto(root, allCategories)).ToList();

        return Result<List<CategoryResponseDto>>.Success(response);
    }

    private static CategoryResponseDto MapToDto(Category category, List<Category> allCategories)
    {
        // Find children in the flat list "allCategories" to avoid multiple DB calls or reliance on EF loading if not fully recursive
        // However, ICategoryRepository.GetAllForFamilyAsync usually does just one level or needs to load all. 
        // If GetAllForFamilyAsync loads EVERYTHING (System + Family) into memory, we can do in-memory recursion.
        
        var children = allCategories
            .Where(c => c.ParentId == category.Id)
            .Select(c => MapToDto(c, allCategories)) // Recursion
            .ToList();

        return new CategoryResponseDto(
            category.Id,
            category.Name,
            category.Type,
            category.Icon,
            category.Color,
            category.ParentId,
            IsCustom: category.FamilyId != null,
            SubCategories: children
        );
    }
}
