using Domain.Enums;

namespace Application.Shared.Objects;

public sealed record AccountsPayableDto(
    Guid Id,
    string Description,
    decimal Amount,
    RecurringFrequency Frequency,
    string CategoryName,
    int DueDay,
    bool IsLate
);
