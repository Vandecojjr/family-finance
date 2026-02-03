using Domain.Enums;

namespace Application.Shared.Auth;

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
    IReadOnlyCollection<string> Roles { get; }
    IReadOnlyCollection<Permission> Permissions { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(Permission permission);
}
