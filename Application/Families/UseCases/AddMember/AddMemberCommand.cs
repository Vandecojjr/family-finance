using Application.Shared.Authorization;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.Families.UseCases.AddMember;

public sealed record AddMemberCommand(
    Guid FamilyId,
    string Name,
    string Email,
    string Document
) : ICommand<Result<Guid>>, IAuthorizeableRequest
{
    public IReadOnlyCollection<Permission> RequiredPermissions => [Permission.FamilyManage];
}
