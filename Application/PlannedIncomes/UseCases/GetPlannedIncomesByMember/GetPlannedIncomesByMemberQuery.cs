using Application.PlannedIncomes.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedIncomes.UseCases.GetPlannedIncomesByMember;

public sealed record GetPlannedIncomesByMemberQuery(Guid MemberId) : IQuery<Result<IReadOnlyCollection<PlannedIncomeResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
