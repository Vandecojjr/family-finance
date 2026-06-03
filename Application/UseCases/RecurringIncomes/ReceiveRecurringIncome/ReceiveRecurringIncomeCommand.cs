using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringIncomes.ReceiveRecurringIncome;

public sealed record ReceiveRecurringIncomeCommand(
    Guid RecurringIncomeId,
    Guid WalletId,
    decimal Amount,
    Guid? BankAccountId = null) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringIncomeUpdate];
}
