using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.RecurringExpenses.PayRecurringExpense;

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

