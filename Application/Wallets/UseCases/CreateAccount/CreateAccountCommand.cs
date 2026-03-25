using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateAccount;

public record CreateAccountCommand(
    Guid WalletId,
    string Name,
    AccountType Type,
    decimal InitialBalance,
    decimal? CreditLimit,
    int? ClosingDay,
    int? DueDay
) : ICommand<Result<Guid>>;
