using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringIncomes.UseCases.DeleteRecurringIncome;

public sealed record DeleteRecurringIncomeCommand(Guid Id) 
    : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeDelete];
}
