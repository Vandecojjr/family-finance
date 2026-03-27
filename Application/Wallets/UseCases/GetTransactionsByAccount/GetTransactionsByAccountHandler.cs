using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Domain.Entities.Wallets;
using Mediator;

namespace Application.Wallets.UseCases.GetTransactionsByAccount;

public sealed class GetTransactionsByAccountHandler(
    IWalletRepository walletRepository
) : IQueryHandler<GetTransactionsByAccountQuery, Result<PagedResult<TransactionResponseDto>>>
{
    public async ValueTask<Result<PagedResult<TransactionResponseDto>>> Handle(GetTransactionsByAccountQuery query, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(query.WalletId, cancellationToken);
        if (wallet is null)
            return Result<PagedResult<TransactionResponseDto>>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == query.AccountId);
        if (account is null)
            return Result<PagedResult<TransactionResponseDto>>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada na carteira informada."));

        (List<Transaction> items, int totalCount) = await walletRepository.GetTransactionsPagedAsync(query.AccountId, query.Page, query.PageSize, cancellationToken);
        
        var dtos = TransactionResponseDto.ToDto(items);
        var pagedResult = new PagedResult<TransactionResponseDto>(dtos, totalCount, query.Page, query.PageSize);
        
        return Result<PagedResult<TransactionResponseDto>>.Success(pagedResult);
    }
}
