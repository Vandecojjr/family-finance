using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetAccountsByWallet;

public sealed class GetAccountsByWalletHandler(
    IWalletRepository walletRepository
) : IQueryHandler<GetAccountsByWalletQuery, Result<List<AccountResponseDto>>>
{
    public async ValueTask<Result<List<AccountResponseDto>>> Handle(GetAccountsByWalletQuery query, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(query.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<List<AccountResponseDto>>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        var dtos = AccountResponseDto.ToDto(wallet.Accounts);
        return Result<List<AccountResponseDto>>.Success(dtos);
    }
}
