using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateWallet;

public record CreateWalletCommand(
    string Name,
    WalletType Type,
    bool IsShared, // true = Family Wallet, false = Personal Wallet
    decimal InitialBalance = 0
) : ICommand<Result<Guid>>;
