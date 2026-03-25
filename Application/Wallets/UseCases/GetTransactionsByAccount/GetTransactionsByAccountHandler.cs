using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetTransactionsByAccount;

public sealed class GetTransactionsByAccountHandler(
    IWalletRepository walletRepository
) : IQueryHandler<GetTransactionsByAccountQuery, Result<List<TransactionResponseDto>>>
{
    public async ValueTask<Result<List<TransactionResponseDto>>> Handle(GetTransactionsByAccountQuery query, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAndTransactionsAsync(query.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<List<TransactionResponseDto>>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == query.AccountId);
        if (account is null)
        {
            return Result<List<TransactionResponseDto>>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada na carteira informada."));
        }

        var dtos = TransactionResponseDto.ToDto(account.Transactions);
        return Result<List<TransactionResponseDto>>.Success(dtos);
    }
}
