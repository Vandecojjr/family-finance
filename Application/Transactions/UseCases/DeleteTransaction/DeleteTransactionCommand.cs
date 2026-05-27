using Application.Shared.Results;
using Mediator;

namespace Application.Transactions.UseCases.DeleteTransaction;

public sealed record DeleteTransactionCommand(Guid Id) : ICommand<Result>;
