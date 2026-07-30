using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Families.AddMember;

public sealed record AddFamilyMemberCommand(
    Guid FamilyId,
    string Name,
    string Email,
    string Password,
    string RoleName
) : ICommand<Result<Guid>>;
