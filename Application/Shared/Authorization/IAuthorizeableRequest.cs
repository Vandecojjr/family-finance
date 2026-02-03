using Domain.Enums;

namespace Application.Shared.Authorization;

public interface IAuthorizeableRequest
{
    IReadOnlyCollection<Permission> RequiredPermissions { get; }
}
