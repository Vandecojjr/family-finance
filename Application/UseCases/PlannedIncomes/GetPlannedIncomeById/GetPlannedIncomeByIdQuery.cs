using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.PlannedIncomes.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedIncomes.GetPlannedIncomeById;

public sealed record GetPlannedIncomeByIdQuery(Guid Id) : IQuery<Result<PlannedIncomeResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
