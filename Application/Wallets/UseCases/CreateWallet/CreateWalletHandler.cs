using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public sealed class CreateWalletHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : ICommandHandler<CreateWalletCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateWalletCommand command, CancellationToken cancellationToken)
    {
        // 1. Get Current User's Family
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
        {
            return Result<Guid>.Failure("User is not associated with any family.");
        }

        Guid? ownerId = null;

        // 2. Determine Owner
        if (command.IsShared)
        {
            // TODO: Optional - Check permission if only Admins can create shared wallets
            // if (!currentUser.HasPermission(Permission.FamilyManage)) ...
            ownerId = null; 
        }
        else
        {
            ownerId = currentUser.Id;
        }

        // 3. Create Wallet
        var wallet = new Wallet(
            command.Name,
            family.Id,
            command.Type,
            ownerId,
            command.InitialBalance
        );

        // 4. Persist
        await walletRepository.AddAsync(wallet, cancellationToken);

        return Result<Guid>.Success(wallet.Id);
    }
}
