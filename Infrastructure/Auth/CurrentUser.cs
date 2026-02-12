using System.Security.Claims;
using Application.Shared.Auth;
using Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Auth;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private readonly ClaimsPrincipal? _user = httpContextAccessor.HttpContext?.User;

    public Guid AccountId => Guid.TryParse(_user?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                                    _user?.FindFirstValue("accountId"), out var id)
        ? id
        : Guid.Empty;

    public Guid MemberId => Guid.TryParse(_user?.FindFirstValue("memberId"), out var id) ? id : Guid.Empty;

    public string Email => _user?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    public IReadOnlyCollection<string> Roles => _user?.FindAll(ClaimTypes.Role)
        .Select(c => c.Value)
        .ToList() ?? [];

    public IReadOnlyCollection<Permission> Permissions => _user?.FindAll("permission")
        .Select(c => Enum.Parse<Permission>(c.Value))
        .ToList() ?? [];

    public bool IsAuthenticated => _user?.Identity?.IsAuthenticated ?? false;

    public bool HasPermission(Permission permission) => Permissions.Contains(permission);
}
