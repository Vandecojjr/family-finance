using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.PlannedIncomes.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedIncomes.GetPlannedIncomesByMember;

public sealed record GetPlannedIncomesByMemberQuery(Guid MemberId) : IQuery<Result<IReadOnlyCollection<PlannedIncomeResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}

