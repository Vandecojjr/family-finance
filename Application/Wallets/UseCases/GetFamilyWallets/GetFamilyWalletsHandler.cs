using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetFamilyWallets;

public sealed class GetFamilyWalletsHandler(
    IWalletRepository walletRepository,
    ICurrentUser currentUser
) : IQueryHandler<GetFamilyWalletsQuery, Result<List<WalletResponseDto>>>
{
    public async ValueTask<Result<List<WalletResponseDto>>> Handle(GetFamilyWalletsQuery query, CancellationToken cancellationToken)
    {
        var wallets = await walletRepository.GetByFamilyIdAsync(query.FamilyId, cancellationToken);
        var dtos = WalletResponseDto.ToDto(wallets);
        return Result<List<WalletResponseDto>>.Success(dtos);
    }
}
