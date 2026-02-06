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
        var family = await familyRepository.GetByMemberIdAsync(currentUser.Id, cancellationToken);
        if (family is null)
            return Result<Guid>.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));
        
        Guid? ownerId = null;

        if (!command.IsShared)
            ownerId = currentUser.Id;
        
        var wallet = new Wallet(command.Name, family.Id, command.Type, ownerId, command.InitialBalance);
        await walletRepository.AddAsync(wallet, cancellationToken);
        return Result<Guid>.Success(wallet.Id);
    }
}
