using Application.Shared.Results;
using Application.UseCases.Transactions.Shared;
using Mediator;

namespace Application.UseCases.Transactions.GetTransactionsByFamily;

public sealed record GetTransactionsByFamilyQuery : IQuery<Result<List<TransactionResponse>>>;
