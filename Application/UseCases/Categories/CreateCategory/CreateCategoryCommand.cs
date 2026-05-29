using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.Categories.CreateCategory;

public sealed record CreateCategoryCommand(
    string Name,
    CategoryType Type,
    Guid? ParentId = null) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.CategoryCreate];
}

