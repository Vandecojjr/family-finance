using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedExpenses.DeletePlannedExpense;

public sealed record DeletePlannedExpenseCommand(Guid Id) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseDelete];
}

