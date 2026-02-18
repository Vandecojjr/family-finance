using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Categories.UseCases.UpdateCategory;

public record UpdateCategoryCommand(
    Guid Id,
    string Name,
    CategoryType Type,
    Guid? ParentId = null
) : ICommand<Result>;
