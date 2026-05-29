using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.DeleteBankAccount;

public sealed class DeleteBankAccountCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteBankAccountCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteBankAccountCommand command,
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

        var hasAccount = wallet.Accounts.Any(a => a.Id == command.AccountId);
        if (!hasAccount)
        {
            return Result.Failure(
                Error.NotFound("BankAccount.NotFound", $"Conta com ID '{command.AccountId}' não foi encontrada nesta carteira."));
        }

        wallet.RemoveAccount(command.AccountId);
        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result.Success();
    }
}

