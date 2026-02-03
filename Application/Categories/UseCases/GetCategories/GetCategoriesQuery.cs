using Application.Categories.Dtos;
using Application.Shared.Results;
using Mediator;

namespace Application.Categories.UseCases.GetCategories;

public record GetCategoriesQuery : IQuery<Result<List<CategoryResponseDto>>>;
