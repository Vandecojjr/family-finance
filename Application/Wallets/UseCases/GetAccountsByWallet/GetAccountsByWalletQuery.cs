using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetAccountsByWallet;

public record GetAccountsByWalletQuery(
    Guid WalletId
) : IQuery<Result<List<AccountResponseDto>>>;
