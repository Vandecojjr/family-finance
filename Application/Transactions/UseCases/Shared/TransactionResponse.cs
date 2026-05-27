namespace Application.Transactions.UseCases.Shared;

public sealed record TransactionResponse(
    Guid Id,
    string Description,
    decimal Amount,
    int Type,
    DateTime Date,
    Guid FamilyId,
    Guid CategoryId,
    string CategoryName,
    Guid? WalletId,
    Guid? BankAccountId,
    Guid? CreditCardId,
    string? WalletName,
    string? BankAccountName,
    string? CreditCardDisplayName,
    string? Notes);
