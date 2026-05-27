using Application.PlannedExpenses.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedExpenses.UseCases.GetPlannedExpensesByMember;

public sealed record GetPlannedExpensesByMemberQuery(Guid MemberId) : IQuery<Result<IReadOnlyCollection<PlannedExpenseResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
