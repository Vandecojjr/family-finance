using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.PlannedExpenses.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedExpenses.GetPlannedExpensesByMember;

public sealed record GetPlannedExpensesByMemberQuery(Guid MemberId) : IQuery<Result<IReadOnlyCollection<PlannedExpenseResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}

