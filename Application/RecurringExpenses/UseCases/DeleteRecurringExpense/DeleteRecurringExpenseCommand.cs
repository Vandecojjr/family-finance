using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.DeleteRecurringExpense;

public sealed record DeleteRecurringExpenseCommand(Guid Id) 
    : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseDelete];
}
