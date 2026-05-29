using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Accounts.Login;

public sealed record LoginCommand(string Email, string Password)
    : ICommand<Result<TokenPairResponse>>;

