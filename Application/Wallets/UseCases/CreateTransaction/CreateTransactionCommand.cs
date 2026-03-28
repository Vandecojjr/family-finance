using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Wallets.UseCases.CreateTransaction;

public record CreateTransactionCommand(
    Guid WalletId,
    Guid AccountId,
    string Description,
    decimal Amount,
    DateTime Date,
    TransactionType Type,
    Guid CategoryId,
    Guid MemberId,
    Guid FamilyId,
    Guid? CardId = null,
    bool IsCredit = false,
    Guid? TransferId = null
) : ICommand<Result<Guid>>;
