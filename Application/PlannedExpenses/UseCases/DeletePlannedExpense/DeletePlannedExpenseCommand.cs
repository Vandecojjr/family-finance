using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedExpenses.UseCases.DeletePlannedExpense;

public sealed record DeletePlannedExpenseCommand(Guid Id) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseDelete];
}
