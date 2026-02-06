using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public record CreateWalletCommand(
    string Name,
    WalletType Type,
    bool IsShared,
    decimal InitialBalance = 0
) : ICommand<Result<Guid>>;
