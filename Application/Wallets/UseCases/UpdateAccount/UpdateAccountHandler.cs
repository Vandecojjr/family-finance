using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.UpdateAccount;

public sealed class UpdateAccountHandler(
    IWalletRepository walletRepository
) : ICommandHandler<UpdateAccountCommand, Result>
{
    public async ValueTask<Result> Handle(UpdateAccountCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        try
        {
            wallet.UpdateAccount(command.AccountId, command.Name);
            await walletRepository.UpdateAsync(wallet, cancellationToken);
            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(Error.Validation("ACCOUNT_UPDATE_ERROR", ex.Message));
        }
    }
}
