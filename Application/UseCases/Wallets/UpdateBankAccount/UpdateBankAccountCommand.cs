using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.Wallets.UpdateBankAccount;

public sealed record UpdateBankAccountCommand(
    Guid WalletId,
    Guid AccountId,
    string BankName,
    AccountType Type,
    decimal DebitBalance,
    decimal CreditLimit) : ICommand<Result>;

