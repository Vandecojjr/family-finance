using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Categories.UseCases.CreateCategory;

public record CreateCategoryCommand(
    string Name,
    CategoryType Type,
    Guid FamilyId,
    Guid? ParentId = null
) : ICommand<Result<Guid>>;
