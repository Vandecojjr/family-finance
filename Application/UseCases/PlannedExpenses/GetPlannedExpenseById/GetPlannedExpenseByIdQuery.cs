using Application.Shared.Authorization;
using Application.Shared.Results;
using Application.UseCases.PlannedExpenses.Shared;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedExpenses.GetPlannedExpenseById;

public sealed record GetPlannedExpenseByIdQuery(Guid Id) : IQuery<Result<PlannedExpenseResponse>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseView];
}
