using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.UpdateRecurringIncome;

public sealed record UpdateRecurringIncomeCommand(
    Guid Id,
    string Description,
    decimal Amount,
    RecurringIncomeType Type,
    RecurringFrequency Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    Guid CategoryId) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeUpdate];
}

