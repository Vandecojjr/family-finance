using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.CreateRecurringIncome;

public sealed record CreateRecurringIncomeCommand(
    string Description,
    decimal Amount,
    RecurringIncomeType Type,
    RecurringFrequency Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    Guid MemberId,
    Guid CategoryId) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeCreate];
}

