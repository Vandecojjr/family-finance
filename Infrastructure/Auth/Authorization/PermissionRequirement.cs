using Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace Infrastructure.Auth.Authorization;

public class PermissionRequirement(Permission permission) : IAuthorizationRequirement
{
    public Permission Permission { get; } = permission;
}
