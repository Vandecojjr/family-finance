using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.CreateWallet;

public sealed record CreateWalletCommand(string Name, decimal CashBalance) : ICommand<Result<Guid>>;
