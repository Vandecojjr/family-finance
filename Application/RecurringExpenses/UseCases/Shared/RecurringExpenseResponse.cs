using Domain.Entities.RecurringExpenses;

namespace Application.RecurringExpenses.UseCases.Shared;

public sealed record RecurringExpenseResponse(
    Guid Id,
    string Description,
    decimal Amount,
    int Type,
    int Frequency,
    int DueDay,
    DateTime StartDate,
    DateTime? EndDate,
    bool IsActive,
    Guid MemberId,
    Guid CategoryId,
    string CategoryName);

public static class RecurringExpenseResponseFactory
{
    public static RecurringExpenseResponse ToResponse(this RecurringExpense expense)
    {
        return new RecurringExpenseResponse(
            expense.Id,
            expense.Description.Value,
            expense.Amount.Value,
            (int)expense.Type,
            (int)expense.Frequency,
            expense.DueDay.Value,
            expense.Period.StartDate,
            expense.Period.EndDate,
            expense.Status.IsActive,
            expense.MemberId,
            expense.CategoryId,
            expense.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<RecurringExpenseResponse> ToResponse(this IEnumerable<RecurringExpense> expenses)
    {
        return expenses.Select(ToResponse).ToList();
    }
}
