using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateAccount;

public sealed class CreateAccountHandler(IWalletRepository walletRepository ) : ICommandHandler<CreateAccountCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateAccountCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
            return Result<Guid>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));

        if (command.IsCash && wallet.Accounts.Any(a => a.IsCash))
            return Result<Guid>.Failure(Error.Conflict("CASH_ACCOUNT_ALREADY_EXISTS", "A carteira já possui uma conta de dinheiro."));

        var account = wallet.AddAccount(
            command.Name,
            command.IsDebit,
            command.IsCredit,
            command.IsInvestment,
            command.IsCash,
            command.InitialBalance,
            command.PreApprovedCreditLimit);

        await walletRepository.UpdateAsync(wallet, cancellationToken);
        return Result<Guid>.Success(account.Id);
    }
}
