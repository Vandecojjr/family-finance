using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.RecurringExpenses.Services;
using Domain.Entities.Transactions;
using Domain.Repositories;
using Mediator;

namespace Application.RecurringExpenses.UseCases.PayRecurringExpense;

public sealed class PayRecurringExpenseCommandHandler(
    IRecurringExpenseRepository recurringExpenseRepository,
    IWalletRepository walletRepository,
    IFamilyRepository familyRepository,
    ICurrentUser currentUser,
    RecurringExpensePaymentService paymentService) : ICommandHandler<PayRecurringExpenseCommand, Result<Guid>>
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

        var recurringExpense = await recurringExpenseRepository.GetByIdAsync(command.RecurringExpenseId, cancellationToken);
        if (recurringExpense is null)
        {
            return Result<Guid>.Failure(
                Error.NotFound("RecurringExpense.NotFound", $"Gasto recorrente com ID '{command.RecurringExpenseId}' não foi encontrado."));
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
            var result = paymentService.ExecutePayment(
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
        await recurringExpenseRepository.UpdateAsync(recurringExpense, cancellationToken);

        return Result<Guid>.Success(transaction.Id);
    }
}
