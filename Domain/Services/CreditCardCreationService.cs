using Domain.Entities.CreidtCards;
using Domain.Entities.Expenses;
using Domain.Entities.Wallets;
using Domain.Repositories;
using Domain.Shared.Repositories;


namespace Domain.Services;

public class CreditCardCreationService : ICreditCardCreationService
{
    private readonly IWalletRepository _walletRepository;
    private readonly IExpenseRepository _expenseRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreditCardCreationService(
        IWalletRepository walletRepository,
        IExpenseRepository expenseRepository,
        IUnitOfWork unitOfWork)
    {
        _walletRepository = walletRepository;
        _expenseRepository = expenseRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> CreateCreditCardWithInvoicesAsync(
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
        CancellationToken cancellationToken = default)
    {
        var account = wallet.Accounts.FirstOrDefault(a => a.Id == accountId);
        if (account is null)
        {
            throw new Exception($"Account with ID {accountId} not found in Wallet {wallet.Id}");
        }

        var invoices = initialInvoices?.Select(i => new CreditCardInvoice(i.DueDate, i.Amount)).ToList();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            account.AddCreditCard(
                brand,
                lastFourDigits,
                totalLimit,
                availableLimit,
                dueDay,
                invoices);

            await _walletRepository.UpdateAsync(wallet, cancellationToken);

            var createdCard = account.CreditCards.LastOrDefault();
            var cardId = createdCard?.Id ?? Guid.Empty;

            if (createdCard != null && createdCard.Invoices.Any())
            {
                foreach (var invoice in createdCard.Invoices)
                {
                    var plannedExpense = Expense.CreatePlanned(
                        $"Fatura Cartão {brand} final {lastFourDigits}",
                        invoice.Amount.Value,
                        invoice.DueDate.Value,
                        memberId,
                        categoryId);

                    await _expenseRepository.AddAsync(plannedExpense, cancellationToken);
                    invoice.LinkExpense(plannedExpense.Id);
                }
            }

            await _unitOfWork.CommitAsync(cancellationToken);

            return cardId;
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
