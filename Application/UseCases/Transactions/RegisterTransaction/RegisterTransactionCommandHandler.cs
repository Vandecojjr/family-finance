using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Transactions;
using Domain.Repositories;
using Domain.Shared.Exceptions;
using Mediator;

namespace Application.UseCases.Transactions.RegisterTransaction;

public sealed class RegisterTransactionCommandHandler(
    IWalletRepository walletRepository,
    ICategoryRepository categoryRepository,
    IFamilyRepository familyRepository,
    IExpenseRepository expenseRepository,
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

        Transaction transaction;
        try
        {
            var result = wallet.RegisterTransaction(
                command.Description,
                command.Amount,
                command.Type,
                command.Date,
                command.CategoryId,
                command.BankAccountId,
                command.CreditCardId,
                command.UseCredit,
                command.Notes,
                command.Installments);

            transaction = result.Transaction;

            if (result.AffectedInvoices != null)
            {
                foreach (var invoice in result.AffectedInvoices)
                {
                    if (invoice.ExpenseId.HasValue)
                    {
                        var exp = await expenseRepository.GetByIdAsync(invoice.ExpenseId.Value, cancellationToken);
                        if (exp != null)
                        {
                            exp.UpdateAmount(invoice.Amount.Value);
                            await expenseRepository.UpdateAsync(exp, cancellationToken);
                        }
                    }
                    else
                    {
                        var affectedCreditCard = wallet.Accounts
                            .SelectMany(a => a.CreditCards)
                            .FirstOrDefault(c => c.Invoices.Any(i => i.Id == invoice.Id));

                        if (affectedCreditCard != null)
                        {
                            var plannedExpense = Domain.Entities.Expenses.Expense.CreatePlanned(
                                $"Fatura Cartão {affectedCreditCard.Brand.Value} final {affectedCreditCard.LastFourDigits.Value}",
                                invoice.Amount.Value,
                                invoice.DueDate.Value,
                                member.Id,
                                command.CategoryId);
                                
                            await expenseRepository.AddAsync(plannedExpense, cancellationToken);
                            invoice.LinkExpense(plannedExpense.Id);
                        }
                    }
                }
            }
        }
        catch (DomainException ex)
        {
            return Result<Guid>.Failure(Error.Validation("Transaction.InvalidOperation", ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Result<Guid>.Failure(Error.Validation("Transaction.InvalidOperation", ex.Message));
        }

        await walletRepository.UpdateAsync(wallet, cancellationToken);

        return Result<Guid>.Success(transaction.Id);
    }
}

