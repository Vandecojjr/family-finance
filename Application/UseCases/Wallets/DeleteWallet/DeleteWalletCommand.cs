using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.DeleteWallet;

public sealed record DeleteWalletCommand(Guid Id) : ICommand<Result>;

