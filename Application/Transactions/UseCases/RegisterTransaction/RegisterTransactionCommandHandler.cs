using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Transactions;
using Domain.Repositories;
using Mediator;

namespace Application.Transactions.UseCases.RegisterTransaction;

public sealed class RegisterTransactionCommandHandler(
    ITransactionRepository transactionRepository,
    IWalletRepository walletRepository,
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser) : ICommandHandler<RegisterTransactionCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        RegisterTransactionCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var category = await categoryRepository.GetByIdAsync(command.CategoryId, cancellationToken);
        if (category is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Category.NotFound", $"Categoria com ID '{command.CategoryId}' não foi encontrada."));
        }

        if (category.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta categoria."));
        }

        if (command.WalletId is null)
        {
            return Result<Guid>.Failure(
                Error.Validation("Transaction.WalletRequired", "Uma carteira de origem é obrigatória para a transação."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.WalletId.Value, cancellationToken);
        if (wallet is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Wallet.NotFound", $"Carteira com ID '{command.WalletId}' não foi encontrada."));
        }

        if (wallet.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a esta carteira."));
        }

        string walletName = wallet.Name.Value;
        string? bankAccountName = null;
        string? creditCardDisplayName = null;

        try
        {
            if (command.BankAccountId.HasValue)
            {
                var account = wallet.Accounts.FirstOrDefault(a => a.Id == command.BankAccountId.Value);
                if (account is null)
                {
                    return Result<Guid>.Failure(
                        Error.NotFound("BankAccount.NotFound", $"Conta com ID '{command.BankAccountId}' não foi encontrada na carteira."));
                }

                bankAccountName = account.BankName.Value;

                if (command.CreditCardId.HasValue)
                {
                    var card = account.CreditCards.FirstOrDefault(c => c.Id == command.CreditCardId.Value);
                    if (card is null)
                    {
                        return Result<Guid>.Failure(
                            Error.NotFound("CreditCard.NotFound", $"Cartão de crédito com ID '{command.CreditCardId}' não foi encontrado na conta."));
                    }

                    creditCardDisplayName = $"{card.Brand.Value} •••• {card.LastFourDigits.Value}";
                }

                // Call adjust balance on the account (both normal bank account or credit card transactions affect bank account balance)
                account.AdjustBalance(command.Amount, command.Type);
            }
            else
            {
                // Physical Cash (dinheiro vivo)
                wallet.AdjustCashBalance(command.Amount, command.Type);
            }
        }
        catch (InvalidOperationException ex)
        {
            return Result<Guid>.Failure(Error.Validation("Transaction.InvalidOperation", ex.Message));
        }

        var transaction = new Transaction(
            command.Description,
            command.Amount,
            command.Type,
            command.Date,
            member.FamilyId,
            command.CategoryId,
            command.WalletId,
            command.BankAccountId,
            command.CreditCardId,
            walletName,
            bankAccountName,
            creditCardDisplayName,
            command.Notes);

        // Save wallet balance changes
        await walletRepository.UpdateAsync(wallet, cancellationToken);

        // Persist transaction
        await transactionRepository.AddAsync(transaction, cancellationToken);

        return Result<Guid>.Success(transaction.Id);
    }
}
