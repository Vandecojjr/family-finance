using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.UpdateWallet;

public sealed record UpdateWalletCommand(Guid Id, string Name, decimal CashBalance) : ICommand<Result>;

