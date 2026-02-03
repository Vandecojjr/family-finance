using Domain.Enums;

namespace Application.Wallets.Dtos;

public record WalletResponseDto(
    Guid Id,
    string Name,
    WalletType Type,
    decimal CurrentBalance,
    bool IsShared,
    Guid? OwnerId
);
