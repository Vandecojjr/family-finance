using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.PlannedIncomes.UseCases.CreatePlannedIncome;

public sealed record CreatePlannedIncomeCommand(
    string Description,
    decimal Amount,
    DateTime Date,
    Guid MemberId,
    Guid CategoryId) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeCreate];
}
