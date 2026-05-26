using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.Categories.UseCases.CreateCategory;

public sealed record CreateCategoryCommand(
    string Name,
    CategoryType Type,
    Guid? ParentId = null) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.CategoryCreate];
}
