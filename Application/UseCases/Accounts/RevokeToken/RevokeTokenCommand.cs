using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Accounts.RevokeToken;

public sealed record RevokeTokenCommand(string RefreshToken)
    : ICommand<Result>;
