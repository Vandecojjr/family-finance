using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.UseCases.CreatePersonalWallet;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateFamilyWallet;

public sealed class CreateFamilyWalletHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : ICommandHandler<CreateFamilyWalletCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateFamilyWalletCommand command, CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByMemberIdAsync(currentUser.MemberId, cancellationToken);
        if (family is null)
            return Result<Guid>.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));
        
        var wallet = Wallet.CreateFamily(command.Name, family.Id, command.Type, command.InitialBalance);
        await walletRepository.AddAsync(wallet, cancellationToken);
        return Result<Guid>.Success(wallet.Id);
    }
}
