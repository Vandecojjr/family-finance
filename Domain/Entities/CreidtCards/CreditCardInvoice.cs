using Domain.Entities.CreidtCards.ValueObjects;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards;

public class CreditCardInvoice : Entity
{
    public Guid CreditCardId { get; private set; }
    public InvoiceDueDate DueDate { get; private set; }
    public InvoiceAmount Amount { get; private set; }
    public bool IsPaid { get; private set; }
    public Guid? ExpenseId { get; private set; }

    public virtual CreditCard CreditCard { get; private set; } = null!;
    public virtual Domain.Entities.Expenses.Expense? Expense { get; private set; }

    #pragma warning disable CS8618
    protected CreditCardInvoice() { }
    #pragma warning restore CS8618

    public CreditCardInvoice(DateTime dueDate, decimal amount, bool isPaid = false)
    {
        DueDate = InvoiceDueDate.Create(dueDate);
        Amount = InvoiceAmount.Create(amount);
        IsPaid = isPaid;
    }

    public void Pay()
    {
        IsPaid = true;
    }

    public void LinkExpense(Guid expenseId)
    {
        ExpenseId = expenseId;
    }

    public void AddAmount(decimal amount)
    {
        Amount = InvoiceAmount.Create(Amount.Value + amount);
    }
}
