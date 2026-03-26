using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetMyTransactions;

public record GetMyTransactionsQuery(int Limit = 50) : IQuery<Result<List<RecentTransactionDto>>>;
