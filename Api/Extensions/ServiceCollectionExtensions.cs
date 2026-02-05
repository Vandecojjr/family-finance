using Application;
using Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using Infrastructure.Auth.Authorization;
using Domain.Enums;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        // Swagger & API explorer
        services.AddEndpointsApiExplorer();

        services.AddOpenApi();

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });

        services.AddAuthorization();
        services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

        services.AddAuthorization(options =>
        {
            foreach (Permission permission in Enum.GetValues(typeof(Permission)))
            {
                options.AddPolicy(permission.ToString(), policy =>
                    policy.Requirements.Add(new PermissionRequirement(permission)));
            }
        });

        // Application and Infrastructure layers
        services.AddApplication();
        services.AddInfrastructure(configuration);
        services.AddScoped<Infrastructure.Data.DataSeeder>();

        return services;
    }
}
