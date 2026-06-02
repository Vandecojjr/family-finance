using Domain.Entities.Categories;
using Domain.Entities.Members;
using Domain.Entities.Incomes.ValueObjects;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Incomes;

public class Income : Entity, IAggregateRoot
{
    public IncomeDescription Description { get; private set; } = null!;
    public IncomeAmount Amount { get; private set; } = null!;
    public IncomeType Type { get; private set; }
    public DateTime? Date { get; private set; } 
    
    public RecurringIncomeType? RecurringType { get; private set; }
    public RecurringFrequency? Frequency { get; private set; }
    public DueDay? DueDay { get; private set; }
    public RecurringPeriod? Period { get; private set; }
    public RecurringIncomeStatus? Status { get; private set; }
    
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }
    
    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Income()
    {
    }
    #pragma warning restore CS8618

    public static Income CreatePlanned(
        string description,
        decimal amount,
        DateTime date,
        Guid memberId,
        Guid categoryId)
    {
        return new Income
        {
            Description = IncomeDescription.Create(description),
            Amount = IncomeAmount.Create(amount),
            Type = IncomeType.Planned,
            Date = date.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
                : date.ToUniversalTime(),
            MemberId = memberId,
            CategoryId = categoryId
        };
    }

    public static Income CreateRecurring(
        string description,
        decimal amount,
        RecurringIncomeType recurringType,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid memberId,
        Guid categoryId)
    {
        return new Income
        {
            Description = IncomeDescription.Create(description),
            Amount = IncomeAmount.Create(amount),
            Type = IncomeType.Recurring,
            RecurringType = recurringType,
            Frequency = frequency,
            DueDay = DueDay.Create(dueDay),
            Period = RecurringPeriod.Create(startDate, endDate),
            Status = RecurringIncomeStatus.Active,
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
        Description = IncomeDescription.Create(description);
        Amount = IncomeAmount.Create(amount);
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        CategoryId = categoryId;
        SeUpdate();
    }

    public void UpdateRecurring(
        string description,
        decimal amount,
        RecurringIncomeType recurringType,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid categoryId)
    {
        Description = IncomeDescription.Create(description);
        Amount = IncomeAmount.Create(amount);
        RecurringType = recurringType;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        CategoryId = categoryId;
        SeUpdate();
    }
}
