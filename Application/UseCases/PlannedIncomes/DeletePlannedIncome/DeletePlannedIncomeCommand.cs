using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.PlannedIncomes.DeletePlannedIncome;

public sealed record DeletePlannedIncomeCommand(Guid Id) : ICommand<Result>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeDelete];
}
