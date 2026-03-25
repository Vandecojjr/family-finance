using Domain.Entities.Wallets;
using Domain.Enums;

namespace Application.Wallets.Dtos;

public record AccountResponseDto(
    Guid Id,
    string Name,
    AccountType Type,
    decimal Balance,
    decimal? CreditLimit,
    int? ClosingDay,
    int? DueDay,
    decimal AvailableLimit,
    decimal UsedCredit,
    Guid WalletId
)
{
    public static List<AccountResponseDto> ToDto(IEnumerable<Account> accounts)
    {
        return accounts.Select(a => new AccountResponseDto(
            a.Id,
            a.Name,
            a.Type,
            a.GetCurrentBalance(),
            a.CreditLimit,
            a.ClosingDay,
            a.DueDay,
            a.GetAvailableLimit(),
            a.GetUsedCredit(),
            a.WalletId
        )).ToList();
    }
}
