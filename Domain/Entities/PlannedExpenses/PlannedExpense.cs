using Domain.Entities.Categories;
using Domain.Entities.Members;
using Domain.Entities.PlannedExpenses.ValueObjects;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.PlannedExpenses;

public class PlannedExpense : Entity, IAggregateRoot
{
    public PlannedExpenseDescription Description { get; private set; } = null!;
    public PlannedExpenseAmount Amount { get; private set; } = null!;
    public DateTime Date { get; private set; }
    public Guid MemberId { get; private set; }
    public Guid CategoryId { get; private set; }

    public virtual Member Member { get; private set; } = null!;
    public virtual Category Category { get; private set; } = null!;

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected PlannedExpense()
    {
    }
    #pragma warning restore CS8618

    public PlannedExpense(
        string description,
        decimal amount,
        DateTime date,
        Guid memberId,
        Guid categoryId)
    {
        Description = PlannedExpenseDescription.Create(description);
        Amount = PlannedExpenseAmount.Create(amount);
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
        Description = PlannedExpenseDescription.Create(description);
        Amount = PlannedExpenseAmount.Create(amount);
        Date = date.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(date, DateTimeKind.Utc)
            : date.ToUniversalTime();
        CategoryId = categoryId;
        SeUpdate();
    }
}
