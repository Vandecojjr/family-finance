using Domain.Entities.RecurringExpenses;
using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Enums;

namespace Domain.Entities.RecurringExpenses.Services;

public class RecurringExpensePaymentService
{
    public (RecurringExpensePayment Payment, Transaction Transaction) ExecutePayment(
        RecurringExpense recurringExpense,
        Wallet wallet,
        decimal amount,
        DateTime date,
        Guid? bankAccountId = null,
        Guid? creditCardId = null,
        bool? useCredit = null)
    {
        if (recurringExpense.Status?.IsActive == false)
        {
            throw new InvalidOperationException("Não é possível realizar o pagamento de um gasto recorrente inativo.");
        }

        int month = date.Month;
        int year = date.Year;

        var payment = recurringExpense.Pay(month, year, amount, date);

        var description = $"Pagamento Gasto Recorrente: {recurringExpense.Description.Value}";
        
        var transaction = wallet.RegisterTransaction(
            description,
            amount,
            TransactionType.Expense,
            date,
            recurringExpense.CategoryId,
            bankAccountId,
            creditCardId,
            useCredit);

        return (payment, transaction);
    }
}
