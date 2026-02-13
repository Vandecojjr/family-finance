using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateFamilyWallet;

public record CreateFamilyWalletCommand(
    string Name,
    WalletType Type,
    decimal InitialBalance = 0
) : ICommand<Result<Guid>>;
