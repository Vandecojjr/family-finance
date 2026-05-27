using Domain.Entities.RecurringIncomes;

namespace Application.RecurringIncomes.UseCases.Shared;

public sealed record RecurringIncomeResponse(
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

public static class RecurringIncomeResponseFactory
{
    public static RecurringIncomeResponse ToResponse(this RecurringIncome income)
    {
        return new RecurringIncomeResponse(
            income.Id,
            income.Description.Value,
            income.Amount.Value,
            (int)income.Type,
            (int)income.Frequency,
            income.DueDay.Value,
            income.Period.StartDate,
            income.Period.EndDate,
            income.Status.IsActive,
            income.MemberId,
            income.CategoryId,
            income.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<RecurringIncomeResponse> ToResponse(this IEnumerable<RecurringIncome> incomes)
    {
        return incomes.Select(ToResponse).ToList();
    }
}
