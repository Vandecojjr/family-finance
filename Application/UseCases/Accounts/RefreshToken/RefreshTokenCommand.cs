using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Accounts.RefreshToken;

public sealed record RefreshTokenCommand(string RefreshToken)
    : ICommand<Result<TokenPairResponse>>;

