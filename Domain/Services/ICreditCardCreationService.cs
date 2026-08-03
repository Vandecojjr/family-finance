using Domain.Entities.Wallets;
using Domain.Entities.CreidtCards;

namespace Domain.Services;

public interface ICreditCardCreationService
{
    Task<Guid> CreateCreditCardWithInvoicesAsync(
        Wallet wallet,
        Guid accountId,
        string brand,
        string lastFourDigits,
        decimal totalLimit,
        decimal availableLimit,
        int dueDay,
        Guid categoryId,
        Guid memberId,
        IEnumerable<(DateTime DueDate, decimal Amount)>? initialInvoices,
        CancellationToken cancellationToken = default);
}
