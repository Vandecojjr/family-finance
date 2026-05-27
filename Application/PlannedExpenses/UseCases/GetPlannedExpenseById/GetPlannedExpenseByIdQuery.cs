using Application.PlannedExpenses.UseCases.Shared;
using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedExpenses.UseCases.GetPlannedExpenseById;

public sealed record GetPlannedExpenseByIdQuery(Guid Id) : IQuery<Result<PlannedExpenseResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
