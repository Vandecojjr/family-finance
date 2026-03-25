using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public record CreateWalletCommand(
    string Name,
    decimal InitialBalance = 0) : ICommand<Result<Guid>>;
