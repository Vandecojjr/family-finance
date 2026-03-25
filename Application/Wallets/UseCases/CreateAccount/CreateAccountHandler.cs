using Application.Shared.Results;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateAccount;

public sealed class CreateAccountHandler(
    IWalletRepository walletRepository
) : ICommandHandler<CreateAccountCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateAccountCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<Guid>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        Guid accountId;

        if (command.Type == AccountType.Credit)
        {
            if (!command.CreditLimit.HasValue || !command.ClosingDay.HasValue || !command.DueDay.HasValue)
            {
                return Result<Guid>.Failure(Error.Validation("INVALID_CREDIT_ACCOUNT", "Contas de crédito requerem limite, dia de fechamento e dia de vencimento."));
            }

            var account = wallet.AddCreditAccount(
                command.Name, 
                command.CreditLimit.Value, 
                command.ClosingDay.Value, 
                command.DueDay.Value);
                
            accountId = account.Id;
        }
        else
        {
            var account = wallet.AddAssetAccount(command.Name, command.Type, command.InitialBalance);
            accountId = account.Id;
        }

        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result<Guid>.Success(accountId);
    }
}
