using Domain.Entities.Categories;
using Domain.Entities.Expenses.ValueObjects;
using Domain.Entities.Members;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Expenses;

public class Expense : Entity, IAggregateRoot
{
    public ExpenseDescription Description { get; private set; } = null!;
    public ExpenseAmount Amount { get; private set; } = null!;
    public ExpenseType Type { get; private set; }
    public DateTime? Date { get; private set; } 
    
    public RecurringExpenseType? RecurringType { get; private set; }
    public RecurringFrequency? Frequency { get; private set; }
    public DueDay? DueDay { get; private set; }
    public RecurringPeriod? Period { get; private set; }
    public RecurringExpenseStatus? Status { get; private set; }
    
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }
    
    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    private readonly List<ExpensePayment> _payments = [];
    public virtual IReadOnlyCollection<ExpensePayment> Payments => _payments.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Expense()
    {
    }
    #pragma warning restore CS8618

    public static Expense CreatePlanned(
        string description,
        decimal amount,
        DateTime date,
        Guid memberId,
        Guid categoryId)
    {
        return new Expense
        {
            Description = ExpenseDescription.Create(description),
            Amount = ExpenseAmount.Create(amount),
            Type = ExpenseType.Planned,
            Date = date.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
                : date.ToUniversalTime(),
            MemberId = memberId,
            CategoryId = categoryId
        };
    }

    public static Expense CreateRecurring(
        string description,
        decimal amount,
        RecurringExpenseType recurringType,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid memberId,
        Guid categoryId)
    {
        return new Expense
        {
            Description = ExpenseDescription.Create(description),
            Amount = ExpenseAmount.Create(amount),
            Type = ExpenseType.Recurring,
            RecurringType = recurringType,
            Frequency = frequency,
            DueDay = DueDay.Create(dueDay),
            Period = RecurringPeriod.Create(startDate, endDate),
            Status = RecurringExpenseStatus.Active,
            MemberId = memberId,
            CategoryId = categoryId
        };
    }

    public void UpdatePlanned(
        string description,
        decimal amount,
        DateTime date,
        Guid categoryId)
    {
        Description = ExpenseDescription.Create(description);
        Amount = ExpenseAmount.Create(amount);
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        CategoryId = categoryId;
        SeUpdate();
    }

    public void UpdateRecurring(
        string description,
        decimal amount,
        RecurringExpenseType recurringType,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid categoryId)
    {
        Description = ExpenseDescription.Create(description);
        Amount = ExpenseAmount.Create(amount);
        RecurringType = recurringType;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        CategoryId = categoryId;
        SeUpdate();
    }

    public ExpensePayment Pay(int month, int year, decimal amount, DateTime date)
    {
        if (Type == ExpenseType.Recurring)
        {
            if (_payments.Any(p => p.Month == month && p.Year == year))
            {
                throw new InvalidOperationException($"O gasto recorrente já foi pago para o mês {month}/{year}.");
            }
        }

        var payment = new ExpensePayment(Id, month, year, amount, date);
        _payments.Add(payment);
        SeUpdate();
        return payment;
    }

    public bool IsPaid() => _payments.Count != 0;
}
