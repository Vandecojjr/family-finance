using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.GetTotalFixedExpensesByMember;

public sealed record GetTotalFixedExpensesByMemberQuery(Guid MemberId) 
    : IQuery<Result<decimal>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
