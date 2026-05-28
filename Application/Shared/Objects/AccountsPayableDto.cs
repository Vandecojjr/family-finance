using Domain.Enums;

namespace Application.Shared.Objects;

public sealed record AccountsPayableDto(
    string Description,
    decimal Amount,
    RecurringFrequency Frequency,
    string CategoryName
);