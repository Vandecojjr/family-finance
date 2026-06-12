using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.CreateWallet;

public sealed record CreateWalletCommand(string Name, decimal InitialCashBalance) : ICommand<Result<Guid>>;

