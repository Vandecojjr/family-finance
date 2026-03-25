using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetTransactionsByAccount;

public record GetTransactionsByAccountQuery(
    Guid WalletId,
    Guid AccountId
) : IQuery<Result<List<TransactionResponseDto>>>;
