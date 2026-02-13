using Api.Endpoints;
using Api.Endpoints.Wallets;
using Scalar.AspNetCore;

namespace Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UsePresentation(this WebApplication app)
    {
        app.UseCors();

        app.UseAuthentication();
        app.UseAuthorization();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference();

            using (var scope = app.Services.CreateScope())
            {
                var seeder = scope.ServiceProvider.GetRequiredService<Infrastructure.Data.DataSeeder>();
                try
                {
                    seeder.SeedAsync().Wait();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Seeding failed: {ex.Message}");
                }
            }
        }

        app.MapAccountEndpoints();
        app.MapFamilyEndpoints();
        app.MapPersonalWalletEndpoints();
        app.MapFamilyWalletEndpoints();
        app.MapCategoryEndpoints();

        return app;
    }
}
