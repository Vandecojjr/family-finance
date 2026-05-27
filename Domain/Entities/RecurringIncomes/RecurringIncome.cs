using Domain.Entities.Categories;
using Domain.Entities.Members;
using Domain.Entities.RecurringIncomes.ValueObjects;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.RecurringIncomes;

public class RecurringIncome : Entity, IAggregateRoot
{
    public RecurringIncomeDescription Description { get; private set; } = null!;
    public RecurringIncomeAmount Amount { get; private set; } = null!;
    public RecurringIncomeType Type { get; private set; }
    public RecurringFrequency Frequency { get; private set; }
    public DueDay DueDay { get; private set; } = null!;
    public RecurringPeriod Period { get; private set; } = null!;
    public RecurringIncomeStatus Status { get; private set; } = null!;
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }
    
    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected RecurringIncome()
    {
    }
    #pragma warning restore CS8618

    public RecurringIncome(
        string description,
        decimal amount,
        RecurringIncomeType type,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid memberId,
        Guid categoryId)
    {
        Description = RecurringIncomeDescription.Create(description);
        Amount = RecurringIncomeAmount.Create(amount);
        Type = type;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        Status = RecurringIncomeStatus.Active;
        MemberId = memberId;
        CategoryId = categoryId;
    }

    public void Update(
        string description,
        decimal amount,
        RecurringIncomeType type,
        RecurringFrequency frequency,
        int dueDay,
        DateTime startDate,
        DateTime? endDate,
        Guid categoryId)
    {
        Description = RecurringIncomeDescription.Create(description);
        Amount = RecurringIncomeAmount.Create(amount);
        Type = type;
        Frequency = frequency;
        DueDay = DueDay.Create(dueDay);
        Period = RecurringPeriod.Create(startDate, endDate);
        CategoryId = categoryId;
        SeUpdate();
    }
}
