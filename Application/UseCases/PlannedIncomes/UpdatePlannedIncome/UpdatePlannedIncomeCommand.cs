using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedIncomes.UpdatePlannedIncome;

public sealed record UpdatePlannedIncomeCommand(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    Guid CategoryId) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeUpdate];
}

