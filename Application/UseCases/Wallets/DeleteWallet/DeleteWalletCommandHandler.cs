using Application.Shared.Auth;
using Application.Shared.Errors;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.DeleteWallet;

public sealed class DeleteWalletCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteWalletCommand, Result>
{
    public async ValueTask<Result> Handle(DeleteWalletCommand command, CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
            return Result.Failure(CommonsErrors.MemberNotFound);

        var wallet = await walletRepository.GetSimpleByIdAsync(command.Id, cancellationToken);
        if (wallet is null)
            return Result.Failure(
                Error.NotFound("Wallet.NotFound", "Carteira não foi encontrada."));

        if (wallet.FamilyId != member.FamilyId)
            return Result.Failure(CommonsErrors.FamilyAccessDenied);

        if (wallet.MemberId != member.Id)
            return Result.Failure(
                Error.Forbidden("Wallet.OwnershipRequired", "Somente o dono da carteira pode excluí-la."));

        await walletRepository.DeleteAsync(wallet, cancellationToken);
        return Result.Success();
    }
}

