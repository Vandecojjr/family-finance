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

        var invoiceWallet = await walletRepository.GetWalletByExpenseIdAsync(recurringExpense.Id, cancellationToken);
        if (invoiceWallet != null)
        {
            if (command.UseCredit == true || command.CreditCardId != null)
            {
                return Result<Guid>.Failure(
                    Error.Failure("Expense.InvalidPaymentMethod", "Não é permitido pagar a fatura de um cartão de crédito utilizando crédito."));
            }
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
                command.UseCredit,
                command.Installments,
                command.ForceNextInvoice);

            if (invoiceWallet != null)
            {
                var creditCard = invoiceWallet.Accounts
                    .SelectMany(a => a.CreditCards)
                    .FirstOrDefault(c => c.Invoices.Any(i => i.ExpenseId == recurringExpense.Id));

                if (creditCard != null)
                {
                    var invoice = creditCard.Invoices.First(i => i.ExpenseId == recurringExpense.Id);
                    invoice.Pay();
                    creditCard.RestoreLimit(command.Amount);
                    await walletRepository.UpdateAsync(invoiceWallet, cancellationToken);
                }
            }

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
                                recurringExpense.CategoryId);
                                
                            await expenseRepository.AddAsync(plannedExpense, cancellationToken);
                            invoice.LinkExpense(plannedExpense.Id);
                        }
                    }
                }
            }

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

