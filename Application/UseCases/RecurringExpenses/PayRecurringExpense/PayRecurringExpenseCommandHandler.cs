using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Transactions;
using Domain.Repositories;
using Domain.Services;
using Mediator;

namespace Application.UseCases.RecurringExpenses.PayRecurringExpense;

public sealed class PayRecurringExpenseCommandHandler(
    IExpenseRepository expenseRepository,
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser,
    ExpensePaymentService expensePaymentService) : ICommandHandler<PayRecurringExpenseCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        PayRecurringExpenseCommand command,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);
        if (member is null)
        {
            return Result<Guid>.Failure(
                Error.Failure("User.MemberNotFound", "Membro do usuário logado não foi encontrado."));
        }

        var recurringExpense = await expenseRepository.GetByIdAsync(command.RecurringExpenseId, cancellationToken);
        if (recurringExpense is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("Expense.NotFound", $"Gasto recorrente com ID '{command.RecurringExpenseId}' não foi encontrado."));
        }

        if (recurringExpense.Member.FamilyId != member.FamilyId)
        {
            return Result<Guid>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem acesso a este gasto recorrente."));
        }

        var wallet = await walletRepository.GetByIdAsync(command.WalletId, cancellationToken);
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
            var result = expensePaymentService.ProcessPayment(
                recurringExpense,
                wallet,
                command.Amount,
                DateTime.UtcNow,
                command.BankAccountId,
                command.CreditCardId,
                command.UseCredit);
            
            transaction = result.Transaction;
        }
        catch (Exception ex)
        {
            return Result<Guid>.Failure(Error.Validation("RecurringExpense.PaymentError", ex.Message));
        }

        await walletRepository.UpdateAsync(wallet, cancellationToken);
        await expenseRepository.UpdateAsync(recurringExpense, cancellationToken);

        return Result<Guid>.Success(transaction.Id);
    }
}

