using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateBankAccount;

public sealed record CreateBankAccountCommand(
    Guid WalletId,
    string BankName,
    AccountType Type,
    decimal DebitBalance,
    decimal CreditLimit) : ICommand<Result<Guid>>;
