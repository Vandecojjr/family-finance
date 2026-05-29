using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.UpdateRecurringExpense;

public sealed record UpdateRecurringExpenseCommand(
    Guid Id,
    string Description,
    decimal Amount,
    RecurringExpenseType Type,
    RecurringFrequency Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    Guid CategoryId) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseUpdate];
}

