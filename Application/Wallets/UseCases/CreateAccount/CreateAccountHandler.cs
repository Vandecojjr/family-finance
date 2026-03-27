using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Enums;
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
        
        Account account = command.Type switch
        {
            AccountType.Credit => wallet.AddCreditAccount(
                command.Name, 
                command.CreditLimit ?? 0, 
                command.ClosingDay ?? 0, 
                command.DueDay ?? 0),
            _ => wallet.AddAssetAccount(command.Name, command.Type, command.InitialBalance)
        };

        await walletRepository.UpdateAsync(wallet, cancellationToken);
        return Result<Guid>.Success(account.Id);
    }
}
