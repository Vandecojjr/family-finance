using Application.PlannedIncomes.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedIncomes.UseCases.GetPlannedIncomeById;

public sealed record GetPlannedIncomeByIdQuery(Guid Id) : IQuery<Result<PlannedIncomeResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
