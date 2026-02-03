using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetMyWallets;

public record GetMyWalletsQuery : IQuery<Result<List<WalletResponseDto>>>;
