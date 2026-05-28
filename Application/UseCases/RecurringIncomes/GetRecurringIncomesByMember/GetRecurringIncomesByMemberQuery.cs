using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.RecurringIncomes.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.GetRecurringIncomesByMember;

public sealed record GetRecurringIncomesByMemberQuery(Guid MemberId) 
    : IQuery<Result<IReadOnlyCollection<RecurringIncomeResponse>>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
