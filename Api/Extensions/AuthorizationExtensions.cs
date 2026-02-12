using Domain.Enums;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace Api.Extensions;

public static class AuthorizationExtensions
{
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, Permission permission)
        where TBuilder : IEndpointConventionBuilder
    {
        return builder.RequireAuthorization(permission.ToString());
    }

    public static TBuilder RequireRole<TBuilder>(this TBuilder builder, string role)
        where TBuilder : IEndpointConventionBuilder
    {
        return builder.RequireAuthorization(new AuthorizeAttribute { Roles = role });
    }
}
