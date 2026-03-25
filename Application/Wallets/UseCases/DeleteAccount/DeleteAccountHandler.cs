using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.DeleteAccount;

public sealed class DeleteAccountHandler(
    IWalletRepository walletRepository
) : ICommandHandler<DeleteAccountCommand, Result>
{
    public async ValueTask<Result> Handle(DeleteAccountCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        try
        {
            wallet.RemoveAccount(command.AccountId);
            await walletRepository.UpdateAsync(wallet, cancellationToken);
            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(Error.Validation("ACCOUNT_DELETE_ERROR", ex.Message));
        }
    }
}
