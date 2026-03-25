using Application.Shared.Results;
using Application.Categories.Dtos;
using Domain.Entities.Categories;
using Domain.Repositories;
using Mediator;

namespace Application.Categories.UseCases.GetCategoryById;

public sealed class GetCategoryByIdHandler(
    ICategoryRepository categoryRepository
) : IQueryHandler<GetCategoryByIdQuery, Result<CategoryResponseDto>>
{
    public async ValueTask<Result<CategoryResponseDto>> Handle(GetCategoryByIdQuery query, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetByIdAsyncWithSubCategories(query.Id, cancellationToken);
        if (category is null)
        {
            return Result<CategoryResponseDto>.Failure(Error.NotFound("CATEGORY_NOT_FOUND", "Categoria não encontrada."));
        }

        var dto = MapToDto(category);
        return Result<CategoryResponseDto>.Success(dto);
    }

    private static CategoryResponseDto MapToDto(Category category)
    {
        var children = category.SubCategories
            .Select(c => MapToDto(c))
            .ToList();

        return new CategoryResponseDto(
            category.Id,
            category.Name,
            category.Type,
            category.ParentId,
            IsCustom: category.FamilyId != Guid.Empty,
            SubCategories: children
        );
    }
}
