using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.UpdateWallet;

public sealed class UpdateWalletCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<UpdateWalletCommand, Result>
{
    public async ValueTask<Result> Handle(
        UpdateWalletCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.Id, cancellationToken);
        if (wallet is null)
        {
            return Result.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{command.Id}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para editar esta carteira."));
        }

        wallet.Update(command.Name, command.CashBalance);
        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result.Success();
    }
}
