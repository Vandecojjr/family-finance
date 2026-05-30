namespace Application.Shared.Objects;

public sealed record GetInitialDashBoardDto(
    General General
    );

public sealed record General(
    decimal TotalExpensed,
    decimal TotalIncomed,
    decimal TotalProjectedExpenditure,
    decimal TotalProjectedIncome,
    decimal TotalBalance,
    decimal TotalCreditLimit,
    decimal TotalCreditExpensed
    );