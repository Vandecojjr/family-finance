using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.RecurringExpenses.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.GetRecurringExpenseById;

public sealed record GetRecurringExpenseByIdQuery(Guid Id) : IQuery<Result<RecurringExpenseResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
