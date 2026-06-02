using Domain.Entities.Incomes;

namespace Application.UseCases.RecurringIncomes.Shared;

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
    public static RecurringIncomeResponse ToResponse(this Income income)
    {
        return new RecurringIncomeResponse(
            income.Id,
            income.Description.Value,
            income.Amount.Value,
            (int)(income.RecurringType ?? 0),
            (int)(income.Frequency ?? 0),
            income.DueDay != null ? income.DueDay.Value : 0,
            income.Period != null ? income.Period.StartDate : DateTime.MinValue,
            income.Period?.EndDate,
            income.Status != null && income.Status.IsActive,
            income.MemberId,
            income.CategoryId,
            income.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<RecurringIncomeResponse> ToResponse(this IEnumerable<Income> incomes)
    {
        return incomes.Select(ToResponse).ToList();
    }
}
