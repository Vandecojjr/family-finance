using Application.Shared.Results;
using Application.Wallets.UseCases.Shared;
using Mediator;

namespace Application.Wallets.UseCases.GetWalletById;

public sealed record GetWalletByIdQuery(Guid Id) : IQuery<Result<WalletResponse>>;
