using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.Categories.UseCases.ListCategories;

public sealed record ListCategoriesQuery() : IQuery<Result<IReadOnlyCollection<CategoryResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.CategoryView];
}
