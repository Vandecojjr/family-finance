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
        // 1. Get Family ID
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
        {
            return Result<List<WalletResponseDto>>.Failure("User is not associated with any family.");
        }

        // 2. Fetch Wallets (Shared + Personal)
        // Using the custom repository method we defined in IWalletRepository to handle the OR logic efficiently
        var wallets = await walletRepository.GetWalletsForUserAsync(family.Id, currentUser.Id, cancellationToken);

        // 3. Map to DTO
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
