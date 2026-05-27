using Application.RecurringIncomes.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringIncomes.UseCases.GetRecurringIncomeById;

public sealed record GetRecurringIncomeByIdQuery(Guid Id) : IQuery<Result<RecurringIncomeResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
