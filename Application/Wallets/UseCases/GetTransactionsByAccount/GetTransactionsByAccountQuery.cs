using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetTransactionsByAccount;

public record GetTransactionsByAccountQuery(
    Guid WalletId,
    Guid AccountId,
    int Page = 1,
    int PageSize = 50
) : IQuery<Result<PagedResult<TransactionResponseDto>>>;
