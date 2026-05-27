namespace Application.Wallets.UseCases.Shared;

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
    decimal TotalLimit);
