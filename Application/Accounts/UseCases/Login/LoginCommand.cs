using Application.Shared.Responses;
using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.Login;

public sealed record LoginCommand(string Email, string Password) : ICommand<Result<TokenPairResponse>>;
