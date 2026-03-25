using Domain.Entities.Wallets;

namespace Application.Wallets.Dtos;

public record WalletResponseDto(
    Guid Id,
    string Name,
    Guid MemberId
)
{
    public static List<WalletResponseDto> ToDto(IEnumerable<Wallet> wallets)
    {
        return wallets.Select(w => new WalletResponseDto(
            w.Id,
            w.Name,
            w.MemberId
        )).ToList();
    }
}
