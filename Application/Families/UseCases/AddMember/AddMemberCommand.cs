using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.AddMember;

public sealed record AddMemberCommand(
    Guid FamilyId,
    string Name,
    string Email,
    string Document
) : ICommand<Result<Guid>>;
