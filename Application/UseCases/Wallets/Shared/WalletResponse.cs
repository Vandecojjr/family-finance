using Domain.Entities.Wallets;
using Domain.Entities.BankAccounts;
using Domain.Entities.CreidtCards;

namespace Application.UseCases.Wallets.Shared;

public sealed record WalletResponse(
    Guid Id,
    string Name,
    decimal CashBalance,
    Guid FamilyId,
    List<BankAccountResponse> Accounts);

public sealed record BankAccountResponse(
    Guid Id,
    string BankName,
    int Type,
    decimal DebitBalance,
    decimal CreditLimit,
    List<CreditCardResponse> CreditCards);

public sealed record CreditCardResponse(
    Guid Id,
    string Brand,
    string LastFourDigits,
    decimal TotalLimit,
    decimal RemainingLimit,
    decimal UsedLimit = 0);

public static class WalletResponseFactory
{
    public static WalletResponse ToResponse(this Wallet wallet)
    {
        return new WalletResponse(
            wallet.Id,
            wallet.Name.Value,
            wallet.CashBalance.Value,
            wallet.FamilyId,
            wallet.Accounts.Select(ToResponse).ToList()
        );
    }

    public static BankAccountResponse ToResponse(this BankAccount account)
    {
        return new BankAccountResponse(
            account.Id,
            account.BankName.Value,
            (int)account.Type,
            account.DebitBalance,
            account.CreditLimit.Value,
            account.CreditCards.Select(ToResponse).ToList()
        );
    }

    public static CreditCardResponse ToResponse(this CreditCard card)
    {
        return new CreditCardResponse(
            card.Id,
            card.Brand.Value,
            card.LastFourDigits.Value,
            card.TotalLimit.Value,
            card.RemainingLimit.Value,
            card.UsagetotalLimit()
        );
    }

    public static IReadOnlyCollection<WalletResponse> ToResponse(this IReadOnlyCollection<Wallet> wallets)
    {
        return wallets.Select(ToResponse).ToList();
    }
}


