using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.DeleteCreditCard;

public sealed record DeleteCreditCardCommand(Guid WalletId, Guid AccountId, Guid CardId) : ICommand<Result>;
