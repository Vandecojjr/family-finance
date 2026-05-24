using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.RevokeToken;

public sealed record RevokeTokenCommand(string RefreshToken)
    : ICommand<Result>;
