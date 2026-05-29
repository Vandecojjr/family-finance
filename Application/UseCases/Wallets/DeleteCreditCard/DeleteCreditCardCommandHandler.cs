using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.DeleteCreditCard;

public sealed class DeleteCreditCardCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteCreditCardCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteCreditCardCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{command.WalletId}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para gerenciar esta carteira."));
        }

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == command.AccountId);
        if (account is null)
        {
            return Result.Failure(
                Error.NotFound("BankAccount.NotFound", $"Conta com ID '{command.AccountId}' não foi encontrada nesta carteira."));
        }

        var hasCard = account.CreditCards.Any(c => c.Id == command.CardId);
        if (!hasCard)
        {
            return Result.Failure(
                Error.NotFound("CreditCard.NotFound", $"Cartão com ID '{command.CardId}' não foi encontrado nesta conta."));
        }

        account.RemoveCreditCard(command.CardId);
        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result.Success();
    }
}

