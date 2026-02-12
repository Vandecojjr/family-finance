using Application;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Infrastructure.Auth.Authorization;
using Domain.Enums;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Infrastructure.Auth;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddOpenApi();

        services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
        {
            options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var jwtOptions = configuration.GetSection("Jwt").Get<JwtOptions>();

                if (jwtOptions is null)
                    throw new InvalidOperationException("Jwt options not found in configuration.");

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.SigningKey))
                };
            });

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });

        services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

        services.AddAuthorization(options =>
        {
            foreach (Permission permission in Enum.GetValues(typeof(Permission)))
            {
                options.AddPolicy(permission.ToString(), policy =>
                {
                    policy.AddAuthenticationSchemes("Bearer");
                    policy.Requirements.Add(new PermissionRequirement(permission));
                });
            }
        });

        services.AddApplication();
        services.AddInfrastructure(configuration);
        services.AddScoped<Infrastructure.Data.DataSeeder>();

        return services;
    }
}
