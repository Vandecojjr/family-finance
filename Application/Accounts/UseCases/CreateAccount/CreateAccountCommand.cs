using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.CreateAccount;

public sealed record CreateAccountCommand(string Email, string PasswordHash, Guid? MemberId) : ICommand<Result<Guid>>;
