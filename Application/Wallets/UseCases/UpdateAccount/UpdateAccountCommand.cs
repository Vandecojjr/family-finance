using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.UpdateAccount;

public record UpdateAccountCommand(
    Guid WalletId,
    Guid AccountId,
    string Name
) : ICommand<Result>;
