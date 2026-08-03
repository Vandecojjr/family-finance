using Domain.Entities.BankAccounts;
using Domain.Entities.BankAccounts.Exceptions;
using Domain.Entities.CreidtCards.Exceptions;
using Domain.Entities.CreidtCards.ValueObjects;
using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.CreidtCards;

public class CreditCard : Entity
{
    public Guid BankAccountId { get; private set; }
    public CreditCardBrand Brand { get; private set; } = null!;
    public LastFourDigits LastFourDigits { get; private set; } = null!;
    public CreditCardLimit TotalLimit { get; private set; } = null!;
    public CreditCardLimit RemainingLimit { get; private set; } = null!;
    public CreditCardDueDate DueDate { get; private set; } = null!;
    private readonly List<CreditCardInvoice> _invoices = new();
    public virtual IReadOnlyCollection<CreditCardInvoice> Invoices => _invoices.AsReadOnly();

    public virtual BankAccount BankAccount { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected CreditCard()
    {
    }
    #pragma warning restore CS8618

    public CreditCard(string brand, string lastFourDigits, decimal totalLimit, decimal availableLimit, int dueDay, Guid bankAccountId, IEnumerable<CreditCardInvoice>? initialInvoices = null)
    {
        Brand = CreditCardBrand.Create(brand);
        LastFourDigits = LastFourDigits.Create(lastFourDigits);
        TotalLimit = CreditCardLimit.Create(totalLimit);
        RemainingLimit = CreditCardLimit.Create(availableLimit);
        DueDate = CreditCardDueDate.Create(dueDay);
        BankAccountId = bankAccountId;

        decimal usedLimit = totalLimit - availableLimit;
        var invoices = initialInvoices?.ToList() ?? new List<CreditCardInvoice>();

        if (usedLimit > 0)
        {
            if (invoices.Count == 0)
                throw new InvalidCreditCardInvoicesException("Como existe limite comprometido, as faturas correspondentes devem ser informadas.");
            
            decimal invoicesSum = invoices.Sum(i => i.Amount.Value);
            if (invoicesSum != usedLimit)
                throw new InvalidCreditCardInvoicesException($"A soma das faturas ({invoicesSum}) não corresponde ao limite comprometido ({usedLimit}).");
                
            _invoices.AddRange(invoices);
        }
        else if (invoices.Count > 0)
        {
            throw new InvalidCreditCardInvoicesException("Não é possível adicionar faturas iniciais se não houver limite comprometido.");
        }
    }

    public void AdjustBalance(decimal amount, TransactionType type)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor do ajuste deve ser maior que zero.", nameof(amount));
        
        if (type == TransactionType.Income)
            throw new BankAccountCreditTransactionMustBeExpenseException();

        if (RemainingLimit.Value < amount)
            throw new InvalidOperationException("Saldo e limite de crédito insuficientes para realizar esta transação.");
            
        RemainingLimit = CreditCardLimit.Create(RemainingLimit.Value - amount);
    }
    
    public decimal UsagetotalLimit() => TotalLimit.Value - RemainingLimit.Value;

    public void RestoreLimit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("O valor restaurado deve ser maior que zero.", nameof(amount));

        var newLimit = RemainingLimit.Value + amount;
        if (newLimit > TotalLimit.Value)
            newLimit = TotalLimit.Value;

        RemainingLimit = CreditCardLimit.Create(newLimit);
    }

    public List<CreditCardInvoice> AddExpenseToInvoices(decimal amount, DateTime transactionDate, int installments)
    {
        var updatedOrCreatedInvoices = new List<CreditCardInvoice>();
        decimal installmentAmount = Math.Round(amount / installments, 2);
        
        // Adiciona a sobra na última parcela se houver diferença de arredondamento
        decimal lastInstallmentAmount = amount - (installmentAmount * (installments - 1));

        int firstInvoiceMonth = transactionDate.Month;
        int firstInvoiceYear = transactionDate.Year;
        
        // Considera 7 dias antes do vencimento para fechamento da fatura
        var dueThisMonth = new DateTime(transactionDate.Year, transactionDate.Month, DueDate.Value, 0, 0, 0, DateTimeKind.Utc);
        var closingDateForCurrentMonth = dueThisMonth.AddDays(-7);

        if (transactionDate >= closingDateForCurrentMonth)
        {
            firstInvoiceMonth++;
            if (firstInvoiceMonth > 12)
            {
                firstInvoiceMonth = 1;
                firstInvoiceYear++;
            }
        }
        
        for (int i = 0; i < installments; i++)
        {
            int currentMonth = firstInvoiceMonth + i;
            int currentYear = firstInvoiceYear;
            while (currentMonth > 12)
            {
                currentMonth -= 12;
                currentYear++;
            }
            
            var invoiceDueDate = new DateTime(currentYear, currentMonth, DueDate.Value, 0, 0, 0, DateTimeKind.Utc);
            var invoice = _invoices.FirstOrDefault(inv => inv.DueDate.Value.Month == currentMonth && inv.DueDate.Value.Year == currentYear);
            
            decimal currentInstallmentAmount = (i == installments - 1) ? lastInstallmentAmount : installmentAmount;

            if (invoice != null)
            {
                invoice.AddAmount(currentInstallmentAmount);
                updatedOrCreatedInvoices.Add(invoice);
            }
            else
            {
                invoice = new CreditCardInvoice(invoiceDueDate, currentInstallmentAmount);
                _invoices.Add(invoice);
                updatedOrCreatedInvoices.Add(invoice);
            }
        }
        return updatedOrCreatedInvoices;
    }
}
