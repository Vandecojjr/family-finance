using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.Transactions.RegisterTransaction;

public sealed record RegisterTransactionCommand(
    string Description,
    decimal Amount,
    TransactionType Type,
    DateTime Date,
    Guid CategoryId,
    Guid? WalletId = null,
    Guid? BankAccountId = null,
    Guid? CreditCardId = null,
    bool? UseCredit = null,
    string? Notes = null) : ICommand<Result<Guid>>;

