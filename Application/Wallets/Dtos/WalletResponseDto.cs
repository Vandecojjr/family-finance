using Domain.Entities.Wallets;
using Domain.Enums;

namespace Application.Wallets.Dtos;

public record WalletResponseDto(
    Guid Id,
    string Name,
    WalletType Type,
    decimal CurrentBalance,
    bool IsShared,
    Guid? OwnerId
)
{
    public static List<WalletResponseDto> ToDto(IEnumerable<Wallet> wallets)
    {
        return wallets.Select(w => new WalletResponseDto(
            w.Id,
            w.Name,
            w.Type,
            w.CurrentBalance,
            w.IsShared,
            w.OwnerId
        )).ToList();
    }
}
