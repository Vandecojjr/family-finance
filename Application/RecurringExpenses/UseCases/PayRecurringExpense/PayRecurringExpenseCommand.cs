using Application.Shared.Results;
using Application.Shared.Authorization;
using Domain.Enums;
using Mediator;

namespace Application.RecurringExpenses.UseCases.PayRecurringExpense;

public sealed record PayRecurringExpenseCommand(
    Guid RecurringExpenseId,
    Guid WalletId,
    decimal Amount,
    Guid? BankAccountId = null,
    Guid? CreditCardId = null,
    bool? UseCredit = null) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.RecurringExpenseUpdate];
}
