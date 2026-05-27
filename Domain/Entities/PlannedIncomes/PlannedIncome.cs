using Domain.Entities.Categories;
using Domain.Entities.Members;
using Domain.Entities.PlannedIncomes.ValueObjects;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.PlannedIncomes;

public class PlannedIncome : Entity, IAggregateRoot
{
    public PlannedIncomeDescription Description { get; private set; } = null!;
    public PlannedIncomeAmount Amount { get; private set; } = null!;
    public DateTime Date { get; private set; }
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }

    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected PlannedIncome()
    {
    }
    #pragma warning restore CS8618

    public PlannedIncome(
        string description,
        decimal amount,
        DateTime date,
        Guid memberId,
        Guid categoryId)
    {
        Description = PlannedIncomeDescription.Create(description);
        Amount = PlannedIncomeAmount.Create(amount);
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        MemberId = memberId;
        CategoryId = categoryId;
    }

    public void Update(
        string description,
        decimal amount,
        DateTime date,
        Guid categoryId)
    {
        Description = PlannedIncomeDescription.Create(description);
        Amount = PlannedIncomeAmount.Create(amount);
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        CategoryId = categoryId;
        SeUpdate();
    }
}
