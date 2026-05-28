using Domain.Entities.Categories;
using Domain.Entities.RecurringExpenses.ValueObjects;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Entities.Members;

namespace Domain.Entities.RecurringExpenses;

public class RecurringExpense : Entity, IAggregateRoot
{
    public RecurringExpenseDescription Description { get; private set; } = null!;
    public RecurringExpenseAmount Amount { get; private set; } = null!;
    public RecurringExpenseType Type { get; private set; }
    public RecurringFrequency Frequency { get; private set; }
    public DueDay DueDay { get; private set; } = null!;
    public RecurringPeriod Period { get; private set; } = null!;
    public RecurringExpenseStatus Status { get; private set; } = null!;
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }
    
    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    private readonly List<RecurringExpensePayment> _payments = [];
    public virtual IReadOnlyCollection<RecurringExpensePayment> Payments => _payments.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected RecurringExpense()
    {
    }
    #pragma warning restore CS8618

    public RecurringExpense(
        string description,
        decimal amount,
        RecurringExpenseType type,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid memberId,
        Guid categoryId)
    {
        Description = RecurringExpenseDescription.Create(description);
        Amount = RecurringExpenseAmount.Create(amount);
        Type = type;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        Status = RecurringExpenseStatus.Active;
        MemberId = memberId;
        CategoryId = categoryId;
    }

    public void Update(
        string description,
        decimal amount,
        RecurringExpenseType type,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid categoryId)
    {
        Description = RecurringExpenseDescription.Create(description);
        Amount = RecurringExpenseAmount.Create(amount);
        Type = type;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        CategoryId = categoryId;
        SeUpdate();
    }

    public RecurringExpensePayment Pay(int month, int year, decimal amount, DateTime date)
    {
        if (_payments.Any(p => p.Month == month && p.Year == year))
        {
            throw new InvalidOperationException($"O gasto recorrente já foi pago para o mês {month}/{year}.");
        }

        var payment = new RecurringExpensePayment(Id, month, year, amount, date);
        _payments.Add(payment);
        SeUpdate();
        return payment;
    }

    public bool IsPaid() => _payments.Count != 0;
}
