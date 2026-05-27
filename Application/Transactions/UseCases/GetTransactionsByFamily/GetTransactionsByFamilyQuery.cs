using Application.Shared.Results;
using Application.Transactions.UseCases.Shared;
using Mediator;

namespace Application.Transactions.UseCases.GetTransactionsByFamily;

public sealed record GetTransactionsByFamilyQuery : IQuery<Result<List<TransactionResponse>>>;
