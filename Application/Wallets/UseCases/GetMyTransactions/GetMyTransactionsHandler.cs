using Application.Shared.Auth;
using Application.Shared.Results;
using Application.Wallets.Dtos;
using Domain.Repositories;
using Mediator;

namespace Application.Wallets.UseCases.GetMyTransactions;

public sealed class GetMyTransactionsHandler(
    IWalletRepository walletRepository,
    ICurrentUser currentUser
) : IQueryHandler<GetMyTransactionsQuery, Result<List<RecentTransactionDto>>>
{
    public async ValueTask<Result<List<RecentTransactionDto>>> Handle(GetMyTransactionsQuery query, CancellationToken cancellationToken)
    {
        var transactions = await walletRepository.GetRecentTransactionsAsync(currentUser.MemberId, query.Limit, cancellationToken);
        
        var dtos = transactions.Select(t => new RecentTransactionDto(
            t.Id,
            t.Description,
            t.Amount,
            t.Date,
            t.Type,
            t.Account?.Name ?? "N/A",
            t.Account?.Wallet?.Name ?? "N/A",
            t.Category?.Name ?? "Sem categoria"
        )).ToList();

        return Result<List<RecentTransactionDto>>.Success(dtos);
    }
}
