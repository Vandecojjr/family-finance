using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.Login;

public sealed record LoginCommand(string UsernameOrEmail, string Password) : ICommand<Result<TokenPairResponse>>;
