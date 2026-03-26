using Domain.Entities.Wallets;
using Domain.Enums;

namespace Application.Wallets.Dtos;

public record RecentTransactionDto(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    TransactionType Type,
    string AccountName,
    string WalletName,
    string CategoryName
);
