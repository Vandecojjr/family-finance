using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.RefreshToken;

public sealed record RefreshTokenCommand(string RefreshToken)
    : ICommand<Result<TokenPairResponse>>;
