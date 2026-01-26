using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.RefreshToken;

public sealed record RefreshTokenCommand(Guid AccountId, string RefreshToken) : ICommand<Result<TokenPairResponse>>;
