using Domain.Shared.Entities;

namespace Domain.Entities.RecurringIncomes.ValueObjects;

public sealed record RecurringIncomeStatus : ValueObject
{
    public bool IsActive { get; init; }

    private RecurringIncomeStatus(bool isActive)
    {
        IsActive = isActive;
    }

    public static RecurringIncomeStatus Active => new(true);
    public static RecurringIncomeStatus Inactive => new(false);
}
