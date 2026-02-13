using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreatePersonalWallet;

public sealed class CreatePersonalWalletHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser
) : ICommandHandler<CreatePersonalWalletCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreatePersonalWalletCommand command, CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByMemberIdAsync(currentUser.MemberId, cancellationToken);
        if (family is null)
            return Result<Guid>.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));
        
        var wallet = Wallet.CreatePersonal(command.Name, family.Id, command.Type, currentUser.MemberId, command.InitialBalance);
        await walletRepository.AddAsync(wallet, cancellationToken);
        return Result<Guid>.Success(wallet.Id);
    }
}
