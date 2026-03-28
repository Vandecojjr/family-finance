using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateAccount;

public record CreateAccountCommand(
    Guid WalletId,
    string Name,
    bool IsDebit,
    bool IsCredit,
    bool IsInvestment,
    bool IsCash,
    decimal InitialBalance,
    decimal PreApprovedCreditLimit
) : ICommand<Result<Guid>>;
