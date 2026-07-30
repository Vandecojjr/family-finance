using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Admin.CreateFamily;

public sealed record CreateFamilyCommand(
    string FamilyName,
    string AdminName,
    string AdminEmail,
    string AdminPassword) : ICommand<Result<Guid>>;
