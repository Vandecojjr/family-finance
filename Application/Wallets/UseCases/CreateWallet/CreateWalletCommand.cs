using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public sealed record CreateWalletCommand(string Name, decimal CashBalance) : ICommand<Result<Guid>>;
