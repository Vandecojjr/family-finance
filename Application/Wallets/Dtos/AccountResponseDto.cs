using Domain.Entities.Wallets;
using Domain.Enums;

namespace Application.Wallets.Dtos;

public record AccountResponseDto(
    Guid Id,
    string Name,
    bool IsDebit,
    bool IsCredit,
    bool IsInvestment,
    bool IsCash,
    decimal Balance,
    decimal InvestmentBalance,
    decimal PreApprovedCreditLimit,
    decimal UsedPreApprovedCredit,
    decimal CollateralCreditLimit,
    Guid WalletId,
    List<CardResponseDto> Cards
)
{
    public static List<AccountResponseDto> ToDto(IEnumerable<Account> accounts)
    {
        return accounts.Select(a => new AccountResponseDto(
            a.Id,
            a.Name,
            a.IsDebit,
            a.IsCredit,
            a.IsInvestment,
            a.IsCash,
            a.Balance,
            a.InvestmentBalance,
            a.PreApprovedCreditLimit,
            a.UsedPreApprovedCredit,
            Math.Round(a.InvestmentBalance * 0.9m, 2),
            a.WalletId,
            a.Cards.Select(c => new CardResponseDto(
                c.Id,
                c.Name,
                c.Limit,
                c.UsedLimit,
                c.ClosingDay,
                c.DueDay,
                c.AccountId
            )).ToList()
        )).ToList();
    }
}
