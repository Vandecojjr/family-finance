using Domain.Entities.Expenses;
using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Enums;

namespace Domain.Services;

public class ExpensePaymentService
{
    public (ExpensePayment Payment, Transaction Transaction, IReadOnlyCollection<Domain.Entities.CreidtCards.CreditCardInvoice>? AffectedInvoices) ProcessPayment(
        Expense expense,
        Wallet wallet,
        decimal amount,
        DateTime date,
        Guid? bankAccountId = null,
        Guid? creditCardId = null,
        bool? useCredit = null,
        int installments = 1)
    {
        var payment = expense.Pay(date.Month, date.Year, amount, date);
        
        var result = wallet.RegisterTransaction(
            $"Pagamento de {expense.Description.Value}",
            amount,
            TransactionType.Expense,
            date,
            expense.CategoryId,
            bankAccountId,
            creditCardId,
            useCredit,
            "Pagamento de despesa",
            installments
        );

        return (payment, result.Transaction, result.AffectedInvoices);
    }
}
