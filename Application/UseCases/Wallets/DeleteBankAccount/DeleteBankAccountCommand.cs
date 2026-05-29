using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Wallets.DeleteBankAccount;

public sealed record DeleteBankAccountCommand(Guid WalletId, Guid AccountId) : ICommand<Result>;

