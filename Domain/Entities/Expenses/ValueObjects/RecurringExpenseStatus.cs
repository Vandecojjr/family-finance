using Domain.Shared.Entities;

namespace Domain.Entities.Expenses.ValueObjects;

public sealed record RecurringExpenseStatus : ValueObject
{
    public bool IsActive { get; }

    private RecurringExpenseStatus(bool isActive)
    {
        IsActive = isActive;
    }

    public static RecurringExpenseStatus Active => new(true);
    public static RecurringExpenseStatus Inactive => new(false);
}
