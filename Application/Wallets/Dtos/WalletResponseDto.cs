using Domain.Entities.Wallets;

namespace Application.Wallets.Dtos;

public record WalletResponseDto(
    Guid Id,
    string Name,
    Guid MemberId,
    decimal CurrentBalance,
    string Type,
    bool IsShared,
    string? OwnerName
)
{
    public static List<WalletResponseDto> ToDto(IEnumerable<Wallet> wallets)
    {
        return wallets.Select(w => new WalletResponseDto(
            w.Id,
            w.Name,
            w.MemberId,
            w.Accounts.Sum(a => a.Balance),
            "Personal", // TODO: Determine Type if applicable from Wallet
            false, // TODO: Resolve IsShared
            w.Member?.Name
        )).ToList();
    }
}
