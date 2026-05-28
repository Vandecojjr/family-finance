using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.RecurringExpenses.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.GetRecurringExpensesByMember;

public sealed record GetRecurringExpensesByMemberQuery(Guid MemberId) 
    : IQuery<Result<IReadOnlyCollection<RecurringExpenseResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
