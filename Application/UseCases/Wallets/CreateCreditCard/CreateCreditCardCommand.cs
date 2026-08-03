using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.CreateCreditCard;

public sealed record CreateCreditCardCommand(
    Guid WalletId,
    Guid AccountId,
    string Brand,
    string LastFourDigits,
    decimal TotalLimit,
    decimal AvailableLimit,
    int DueDay,
    Guid CategoryId,
    IEnumerable<CreditCardInvoiceRequest>? Invoices = null) : ICommand<Result<Guid>>;
