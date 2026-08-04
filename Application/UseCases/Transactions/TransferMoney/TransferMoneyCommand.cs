using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Transactions.TransferMoney;

public sealed record TransferMoneyCommand(
    decimal Amount,
    DateTime Date,
    Guid? CategoryId,
    Guid? SourceWalletId,
    Guid? SourceBankAccountId,
    Guid? DestinationWalletId,
    Guid? DestinationBankAccountId,
    string? Notes) : ICommand<Result<Guid[]>>;
