namespace Application.Wallets.Dtos;

public record CardResponseDto(
    Guid Id,
    string Name,
    decimal Limit,
    decimal UsedLimit,
    int ClosingDay,
    int DueDay,
    Guid AccountId
);
