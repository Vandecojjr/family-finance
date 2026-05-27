using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringIncomes.UseCases.GetTotalFixedIncomesByMember;

public sealed record GetTotalFixedIncomesByMemberQuery(Guid MemberId) 
    : IQuery<Result<decimal>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}
