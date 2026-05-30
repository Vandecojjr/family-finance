using Application.Shared.Results;
using Application.UseCases.Wallets.Shared;
using Mediator;

namespace Application.UseCases.Wallets.GetWalletsByFamily;

public sealed record GetWalletsByFamilyQuery : IQuery<Result<IReadOnlyCollection<WalletResponse>>>;

