using Application.RecurringIncomes.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringIncomes.UseCases.GetRecurringIncomesByMember;

public sealed record GetRecurringIncomesByMemberQuery(Guid MemberId) 
    : IQuery<Result<IReadOnlyCollection<RecurringIncomeResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
