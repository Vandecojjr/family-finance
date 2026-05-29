using Application.Shared.Results;
using Application.UseCases.Wallets.Shared;
using Mediator;

namespace Application.UseCases.Wallets.GetWalletById;

public sealed record GetWalletByIdQuery(Guid Id) : IQuery<Result<WalletResponse>>;

