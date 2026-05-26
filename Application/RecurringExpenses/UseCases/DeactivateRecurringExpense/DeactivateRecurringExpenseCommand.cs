using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.DeactivateRecurringExpense;

public sealed record DeactivateRecurringExpenseCommand(Guid Id) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseUpdate];
}
