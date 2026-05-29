using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.DeleteWallet;

public sealed class DeleteWalletCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteWalletCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteWalletCommand command,
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
                Error.Failure("Family.AccessDenied", "Você não tem permissão para excluir esta carteira."));
        }

        await walletRepository.DeleteAsync(wallet, cancellationToken);

        return Result.Success();
    }
}

