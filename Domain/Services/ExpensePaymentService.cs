using Domain.Entities.Expenses;
using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Enums;

namespace Domain.Services;

public class ExpensePaymentService
{
    public (ExpensePayment Payment, Transaction Transaction) ProcessPayment(
        Expense expense,
        Wallet wallet,
        decimal amount,
        DateTime date,
        Guid? bankAccountId = null,
        Guid? creditCardId = null,
        bool? useCredit = null)
    {
        var payment = expense.Pay(date.Month, date.Year, amount, date);
        
        var transaction = wallet.RegisterTransaction(
            $"Pagamento de {expense.Description.Value}",
            amount,
            TransactionType.Expense,
            date,
            expense.CategoryId,
            bankAccountId,
            creditCardId,
            useCredit,
            "Pagamento de despesa"
        );

        return (payment, transaction);
    }
}
