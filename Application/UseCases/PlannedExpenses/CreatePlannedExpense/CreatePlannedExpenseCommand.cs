using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedExpenses.CreatePlannedExpense;

public sealed record CreatePlannedExpenseCommand(
    string Description,
    decimal Amount,
    DateTime Date,
    Guid MemberId,
    Guid CategoryId) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseCreate];
}

