using Application;
using Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPresentation(this IServiceCollection services, IConfiguration configuration)
    {
        // Swagger & API explorer
        services.AddEndpointsApiExplorer();

        services.AddOpenApi();

        // Application and Infrastructure layers
        services.AddApplication();
        services.AddInfrastructure(configuration);

        return services;
    }
}
