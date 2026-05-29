using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Transactions.DeleteTransaction;

public sealed record DeleteTransactionCommand(Guid Id) : ICommand<Result>;

