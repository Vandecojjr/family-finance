using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.DeleteRecurringExpense;

public sealed record DeleteRecurringExpenseCommand(Guid Id) 
    : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseDelete];
}
