using Application.RecurringExpenses.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.GetRecurringExpenseById;

public sealed record GetRecurringExpenseByIdQuery(Guid Id) : IQuery<Result<RecurringExpenseResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
