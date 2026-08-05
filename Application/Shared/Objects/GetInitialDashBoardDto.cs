namespace Application.Shared.Objects;

public sealed record GetInitialDashBoardDto(
    General General,
    IReadOnlyCollection<CategorySummaryDto> ProjectedIncomesByCategory,
    IReadOnlyCollection<CategorySummaryDto> ProjectedExpensesByCategory
    );

public sealed record General(
    decimal TotalExpensed,
    decimal TotalIncomed,
    decimal TotalProjectedExpenditure,
    decimal TotalProjectedIncome,
    decimal TotalBalance,
    decimal TotalCreditLimit,
    decimal TotalCreditExpensed,
    decimal TotalCreditRemainingLimit
    );

public sealed record CategorySummaryDto(
    string CategoryName,
    decimal TotalAmount
    );