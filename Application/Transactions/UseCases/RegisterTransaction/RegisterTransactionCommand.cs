using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Transactions.UseCases.RegisterTransaction;

public sealed record RegisterTransactionCommand(
    string Description,
    decimal Amount,
    TransactionType Type,
    DateTime Date,
    Guid CategoryId,
    Guid? WalletId = null,
    Guid? BankAccountId = null,
    Guid? CreditCardId = null,
    string? Notes = null) : ICommand<Result<Guid>>;
