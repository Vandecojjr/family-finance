using System.Data;
using Application.Shared.Auth;
using Application.Shared.Repositories;
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

        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
        services.AddScoped<IDbConnection>(sp => 
            sp.GetRequiredService<ISqlConnectionFactory>().CreateConnection());

        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<IFamilyRepository, FamilyRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IExpenseRepository, ExpenseRepository>();
        services.AddScoped<IIncomeRepository, IncomeRepository>();
        services.AddScoped<IWalletRepository, WalletRepository>();
        services.AddScoped<IAccountsPayableRepository, AccountsPayableRepository>();
        services.AddScoped<IDashboardRepository, DashboardReposiroty>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        return services;
    }
}
