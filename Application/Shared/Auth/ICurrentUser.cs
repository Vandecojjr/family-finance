using Domain.Enums;

namespace Application.Shared.Auth;

public interface ICurrentUser
{
    Guid AccountId { get; }
    Guid MemberId { get; }
    string Email { get; }
    IReadOnlyCollection<string> Roles { get; }
    IReadOnlyCollection<Permission> Permissions { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(Permission permission);
}
