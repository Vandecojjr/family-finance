using Domain.Entities.Incomes;

namespace Application.UseCases.PlannedIncomes.Shared;

public sealed record PlannedIncomeResponse(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    Guid MemberId,
    Guid CategoryId,
    string CategoryName);

public static class PlannedIncomeResponseFactory
{
    public static PlannedIncomeResponse ToResponse(this Income income)
    {
        return new PlannedIncomeResponse(
            income.Id,
            income.Description.Value,
            income.Amount.Value,
            income.Date ?? DateTime.MinValue,
            income.MemberId,
            income.CategoryId,
            income.Category?.Name?.Value ?? string.Empty);
    }

    public static IReadOnlyCollection<PlannedIncomeResponse> ToResponse(this IEnumerable<Income> incomes)
    {
        return incomes.Select(ToResponse).ToList();
    }
}
