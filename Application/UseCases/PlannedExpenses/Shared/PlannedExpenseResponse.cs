using Domain.Entities.Expenses;

namespace Application.UseCases.PlannedExpenses.Shared;

public sealed record PlannedExpenseResponse(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    Guid MemberId,
    Guid CategoryId,
    string CategoryName);

public static class PlannedExpenseResponseFactory
{
    public static PlannedExpenseResponse ToResponse(this Expense expense)
    {
        return new PlannedExpenseResponse(
            expense.Id,
            expense.Description.Value,
            expense.Amount.Value,
            expense.Date ?? DateTime.UtcNow,
            expense.MemberId,
            expense.CategoryId,
            expense.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<PlannedExpenseResponse> ToResponse(this IEnumerable<Expense> expenses)
    {
        return expenses.Select(ToResponse).ToList();
    }
}

