using Application.Shared.Auth;
using Infrastructure.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Domain.Repositories;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IAuthTokenService, JwtAuthTokenService>();

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<IFamilyRepository, FamilyRepository>();
        services.AddScoped<IRecurringExpenseRepository, RecurringExpenseRepository>();
        services.AddScoped<IRecurringIncomeRepository, RecurringIncomeRepository>();
        services.AddScoped<IPlannedIncomeRepository, PlannedIncomeRepository>();
        services.AddScoped<IPlannedExpenseRepository, PlannedExpenseRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IWalletRepository, WalletRepository>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        return services;
    }
}
