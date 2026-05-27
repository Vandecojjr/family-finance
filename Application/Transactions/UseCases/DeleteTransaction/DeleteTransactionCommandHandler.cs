using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Enums;
using Domain.Repositories;
using Mediator;

namespace Application.Transactions.UseCases.DeleteTransaction;

public sealed class DeleteTransactionCommandHandler(
    ITransactionRepository transactionRepository,
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<DeleteTransactionCommand, Result>
{
    public async ValueTask<Result> Handle(
        DeleteTransactionCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var transaction = await transactionRepository.GetByIdAsync(command.Id, cancellationToken);
        if (transaction is null)
        {
            return Result.Failure(
                Error.NotFound("Transaction.NotFound", $"Transação com ID '{command.Id}' não foi encontrada."));
        }

        if (transaction.FamilyId != member.FamilyId)
        {
            return Result.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta transação."));
        }

        // Reverse balance impact if the wallet/account is still available
        if (transaction.WalletId.HasValue)
        {
            var wallet = await walletRepository.GetByIdAsync(transaction.WalletId.Value, cancellationToken);
            if (wallet is not null && wallet.FamilyId == member.FamilyId)
            {
                var reversalType = transaction.Type == TransactionType.Income 
                    ? TransactionType.Expense 
                    : TransactionType.Income;

                try
                {
                    if (transaction.BankAccountId.HasValue)
                    {
                        var account = wallet.Accounts.FirstOrDefault(a => a.Id == transaction.BankAccountId.Value);
                        if (account is not null)
                        {
                            account.AdjustBalance(transaction.Amount, reversalType);
                            await walletRepository.UpdateAsync(wallet, cancellationToken);
                        }
                    }
                    else
                    {
                        wallet.AdjustCashBalance(transaction.Amount, reversalType);
                        await walletRepository.UpdateAsync(wallet, cancellationToken);
                    }
                }
                catch (InvalidOperationException ex)
                {
                    // If reversing the transaction causes validation issues (e.g. going negative or violating bounds), return validation failure
                    return Result.Failure(Error.Validation("Transaction.ReversalInvalid", $"Não foi possível reverter a transação: {ex.Message}"));
                }
            }
        }

        await transactionRepository.DeleteAsync(transaction, cancellationToken);

        return Result.Success();
    }
}
