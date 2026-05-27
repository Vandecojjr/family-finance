using Application.Shared.Results;
using Application.Wallets.UseCases.Shared;
using Mediator;

namespace Application.Wallets.UseCases.GetWalletsByFamily;

public sealed record GetWalletsByFamilyQuery : IQuery<Result<List<WalletResponse>>>;
