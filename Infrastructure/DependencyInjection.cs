using Application.Shared.Auth;
using Infrastructure.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Data;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind Jwt options
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

        // Auth services
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IAuthTokenService, JwtAuthTokenService>();

        // DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("FamilyFinanceDb"));

        return services;
    }
}
