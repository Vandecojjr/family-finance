using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.DeleteRecurringIncome;

public sealed record DeleteRecurringIncomeCommand(Guid Id) 
    : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeDelete];
}

