using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.Register;

public sealed record RegisterAccountCommand(
    string Name,
    string Email,
    string Password,
    string FamilyName,
    string Document
) : ICommand<Result<Guid>>;
