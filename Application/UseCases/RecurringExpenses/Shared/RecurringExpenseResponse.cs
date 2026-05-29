using Domain.Entities.Expenses;

namespace Application.UseCases.RecurringExpenses.Shared;

public sealed record RecurringExpenseResponse(
    Guid Id,
    string Description,
    decimal Amount,
    int Type,
    int? Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    bool IsActive,
    Guid MemberId,
    Guid CategoryId,
    bool isPaid,
    string? CategoryName);

public static class RecurringExpenseResponseFactory
{
    public static RecurringExpenseResponse ToResponse(this Expense expense)
    {
        return new RecurringExpenseResponse(
            expense.Id,
            expense.Description.Value,
            expense.Amount.Value,
            (int)expense.Type,
            (int?)expense.Frequency,
            expense.DueDay?.Value ?? 1,
            expense.Period?.StartDate ?? DateTime.UtcNow,
            expense.Period?.EndDate,
            expense.Status?.IsActive ?? false,
            expense.MemberId,
            expense.CategoryId,
            expense.IsPaid(),
            expense.Category?.Name.Value
            );
    }

    public static IReadOnlyCollection<RecurringExpenseResponse> ToResponse(this IEnumerable<Expense> expenses)
    {
        return expenses.Select(ToResponse).ToList();
    }
}

