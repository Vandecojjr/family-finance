using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.CreateCreditCard;

public sealed record CreateCreditCardCommand(
    Guid WalletId,
    Guid AccountId,
    string Brand,
    string LastFourDigits,
    decimal TotalLimit) : ICommand<Result<Guid>>;

