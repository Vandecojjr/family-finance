using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.RecurringIncomes.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.GetRecurringIncomeById;

public sealed record GetRecurringIncomeByIdQuery(Guid Id) : IQuery<Result<RecurringIncomeResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}

