using Application.RecurringExpenses.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.GetRecurringExpensesByMember;

public sealed record GetRecurringExpensesByMemberQuery(Guid MemberId) 
    : IQuery<Result<IReadOnlyCollection<RecurringExpenseResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
