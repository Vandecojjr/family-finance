using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetMyWallets;

public sealed class GetMyWalletsHandler(
    IWalletRepository walletRepository,
    ICurrentUser currentUser
) : IQueryHandler<GetMyWalletsQuery, Result<List<WalletResponseDto>>>
{
    public async ValueTask<Result<List<WalletResponseDto>>> Handle(GetMyWalletsQuery query, CancellationToken cancellationToken)
    {
        var wallets = await walletRepository.GetWalletsForUserAsync(currentUser.AccountId, cancellationToken);
        var dtos = WalletResponseDto.ToDto(wallets);
        return Result<List<WalletResponseDto>>.Success(dtos);
    }
}
