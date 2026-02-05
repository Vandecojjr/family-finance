using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetMyWallets;

public sealed class GetMyWalletsHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : IQueryHandler<GetMyWalletsQuery, Result<List<WalletResponseDto>>>
{
    public async ValueTask<Result<List<WalletResponseDto>>> Handle(GetMyWalletsQuery query, CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
        {
            return Result<List<WalletResponseDto>>.Failure(Error.None);
        }

        var wallets = await walletRepository.GetWalletsForUserAsync(family.Id, currentUser.Id, cancellationToken);

        var dtos = wallets.Select(w => new WalletResponseDto(
            w.Id,
            w.Name,
            w.Type,
            w.CurrentBalance,
            IsShared: w.OwnerId == null,
            w.OwnerId
        )).ToList();

        return Result<List<WalletResponseDto>>.Success(dtos);
    }
}
