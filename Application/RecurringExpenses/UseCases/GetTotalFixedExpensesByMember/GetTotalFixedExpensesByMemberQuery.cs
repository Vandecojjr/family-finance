using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.GetTotalFixedExpensesByMember;

public sealed record GetTotalFixedExpensesByMemberQuery(Guid MemberId) 
    : IQuery<Result<decimal>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
