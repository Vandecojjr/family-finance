using Application.Shared.Results;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateTransaction;

public sealed class CreateTransactionHandler(
    IWalletRepository walletRepository
) : ICommandHandler<CreateTransactionCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateTransactionCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAndTransactionsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
        {
            return Result<Guid>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));
        }

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == command.AccountId);
        if (account is null)
        {
            return Result<Guid>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada na carteira informada."));
        }

        Transaction transaction;
        if (command.Type == TransactionType.Expense)
        {
            transaction = Transaction.CreateExpense(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, command.MemberId, command.FamilyId);
        }
        else if (command.Type == TransactionType.Income)
        {
            transaction = Transaction.CreateIncome(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, command.MemberId, command.FamilyId);
        }
        else
        {
            transaction = Transaction.CreateTransfer(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, command.MemberId, command.FamilyId, command.TransferId ?? Guid.Empty);
        }

        try
        {
            account.AddTransaction(transaction);
            await walletRepository.UpdateAsync(wallet, cancellationToken);
            return Result<Guid>.Success(transaction.Id);
        }
        catch (ArgumentException ex)
        {
            return Result<Guid>.Failure(Error.Validation("TRANSACTION_CREATE_ERROR", ex.Message));
        }
    }
}
