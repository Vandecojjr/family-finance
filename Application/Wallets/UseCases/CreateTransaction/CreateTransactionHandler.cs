using Application.Shared.Results;
using Application.Shared.Auth;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.CreateTransaction;

public sealed class CreateTransactionHandler(
    IWalletRepository walletRepository,
    ICurrentUser currentUser
) : ICommandHandler<CreateTransactionCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateTransactionCommand command, CancellationToken cancellationToken)
    {
        var wallet = await walletRepository.GetByIdWithAccountsAndTransactionsAsync(command.WalletId, cancellationToken);
        if (wallet is null)
            return Result<Guid>.Failure(Error.NotFound("WALLET_NOT_FOUND", "Carteira não encontrada."));

        var account = wallet.Accounts.FirstOrDefault(a => a.Id == command.AccountId);
        if (account is null)
            return Result<Guid>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada na carteira informada."));

        if (wallet.Member?.Family is null)
            return Result<Guid>.Failure(Error.Validation("MEMBER_OR_FAMILY_NOT_FOUND", "Membro ou Família não encontrados."));

        Guid familyId = wallet.Member.Family.Id;
        Guid memberId = currentUser.MemberId;

        Transaction? transaction = command.Type switch
        {
            TransactionType.Expense => Transaction.CreateExpense(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, memberId, familyId, command.CardId, command.IsCredit),
            TransactionType.Income => Transaction.CreateIncome(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, memberId, familyId),
            TransactionType.Transfer when command.TransferId is { } tid => Transaction.CreateTransfer(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, memberId, familyId, tid),
            TransactionType.Investment => Transaction.CreateInvestment(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, memberId, familyId),
            TransactionType.Redemption => Transaction.CreateRedemption(command.Description, command.Amount, command.Date, command.AccountId, command.CategoryId, memberId, familyId),
            _ => null
        };

        if (transaction is null)
        {
            var errorMsg = command.Type == TransactionType.Transfer ? "O ID da transferência é obrigatório para transferências." : "Tipo de transação inválido.";
            return Result<Guid>.Failure(Error.Validation("INVALID_TRANSACTION", errorMsg));
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
