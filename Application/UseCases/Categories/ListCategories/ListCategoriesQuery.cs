using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.Categories.ListCategories;

public sealed record ListCategoriesQuery() : IQuery<Result<IReadOnlyCollection<CategoryResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.CategoryView];
}
