using Application.Shared.Results;
using Application.Wallets.Dtos;
using Mediator;

namespace Application.Wallets.UseCases.GetFamilyWallets;

public record GetFamilyWalletsQuery(Guid FamilyId) : IQuery<Result<List<WalletResponseDto>>>;
