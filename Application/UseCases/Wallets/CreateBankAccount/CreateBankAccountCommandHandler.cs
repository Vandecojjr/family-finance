using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Wallets.CreateBankAccount;

public sealed class CreateBankAccountCommandHandler(
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<CreateBankAccountCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateBankAccountCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{command.WalletId}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para gerenciar esta carteira."));
        }

        wallet.AddAccount(
            command.BankName,
            command.Type,
            command.DebitBalance,
            command.CreditLimit);

        await walletRepository.UpdateAsync(wallet, cancellationToken);

        var createdAccount = wallet.Accounts.LastOrDefault();
        var accountId = createdAccount?.Id ?? Guid.Empty;

        return Result<Guid>.Success(accountId);
    }
}

