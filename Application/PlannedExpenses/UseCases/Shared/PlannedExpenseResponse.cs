using Domain.Entities.PlannedExpenses;

namespace Application.PlannedExpenses.UseCases.Shared;

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
    public static PlannedExpenseResponse ToResponse(this PlannedExpense expense)
    {
        return new PlannedExpenseResponse(
            expense.Id,
            expense.Description,
            expense.Amount,
            expense.Date,
            expense.MemberId,
            expense.CategoryId,
            expense.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<PlannedExpenseResponse> ToResponse(this IEnumerable<PlannedExpense> expenses)
    {
        return expenses.Select(ToResponse).ToList();
    }
}
