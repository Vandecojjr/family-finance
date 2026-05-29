using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.GetTotalFixedIncomesByMember;

public sealed record GetTotalFixedIncomesByMemberQuery(Guid MemberId) 
    : IQuery<Result<decimal>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeView];
}

