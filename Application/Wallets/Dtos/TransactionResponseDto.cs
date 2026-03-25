using Domain.Entities.Wallets;
using Domain.Enums;

namespace Application.Wallets.Dtos;

public record TransactionResponseDto(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    TransactionType Type,
    Guid AccountId,
    Guid CategoryId,
    Guid MemberId,
    Guid FamilyId,
    Guid? TransferId
)
{
    public static List<TransactionResponseDto> ToDto(IEnumerable<Transaction> transactions)
    {
        return transactions.Select(t => new TransactionResponseDto(
            t.Id,
            t.Description,
            t.Amount,
            t.Date,
            t.Type,
            t.AccountId,
            t.CategoryId,
            t.MemberId,
            t.FamilyId,
            t.TransferId
        )).ToList();
    }
}
