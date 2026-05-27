using Application.Shared.Results;
using Mediator;

namespace Application.Wallets.UseCases.DeleteBankAccount;

public sealed record DeleteBankAccountCommand(Guid WalletId, Guid AccountId) : ICommand<Result>;
