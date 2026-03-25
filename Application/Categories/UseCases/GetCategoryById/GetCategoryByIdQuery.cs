using Application.Shared.Results;
using Application.Categories.Dtos;
using Mediator;

namespace Application.Categories.UseCases.GetCategoryById;

public record GetCategoryByIdQuery(
    Guid Id
) : IQuery<Result<CategoryResponseDto>>;
