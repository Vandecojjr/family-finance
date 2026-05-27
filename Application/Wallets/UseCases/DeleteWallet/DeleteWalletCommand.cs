using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.DeleteWallet;

public sealed record DeleteWalletCommand(Guid Id) : ICommand<Result>;
