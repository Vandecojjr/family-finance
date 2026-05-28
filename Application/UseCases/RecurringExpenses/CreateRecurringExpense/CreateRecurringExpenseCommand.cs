using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.CreateRecurringExpense;

public sealed record CreateRecurringExpenseCommand(
    string Description,
    decimal Amount,
    RecurringExpenseType Type,
    RecurringFrequency Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    Guid MemberId,
    Guid CategoryId) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseCreate];
}
