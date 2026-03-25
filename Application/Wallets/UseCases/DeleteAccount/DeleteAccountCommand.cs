using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.DeleteAccount;

public record DeleteAccountCommand(
    Guid WalletId,
    Guid AccountId
) : ICommand<Result>;
