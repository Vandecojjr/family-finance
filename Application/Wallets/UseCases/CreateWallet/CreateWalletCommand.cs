using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public sealed record CreateWalletCommand(
    string Name) : ICommand<Result<Guid>>;
