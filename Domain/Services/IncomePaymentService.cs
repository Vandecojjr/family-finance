using Domain.Entities.Incomes;
using Domain.Entities.Transactions;
using Domain.Entities.Wallets;
using Domain.Enums;

namespace Domain.Services;

public class IncomePaymentService
{
    public (IncomePayment Payment, Transaction Transaction) ProcessPayment(
        Income income,
        Wallet wallet,
        decimal amount,
        DateTime date,
        Guid? bankAccountId = null)
    {
        var payment = income.Receive(date.Month, date.Year, amount, date);
        
        var result = wallet.RegisterTransaction(
            $"Recebimento de {income.Description.Value}",
            amount,
            TransactionType.Income,
            date,
            income.CategoryId,
            bankAccountId,
            null,
            false,
            "Recebimento de receita"
        );

        return (payment, result.Transaction);
    }
}
