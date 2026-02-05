using Api.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
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
                    // Log error or ignore for now if DB not ready
                    Console.WriteLine($"Seeding failed: {ex.Message}");
                }
            }
        }

        // app.UseHttpsRedirection(); // Potential cause for NetworkError if certs are not trusted

        app.MapAccountEndpoints();
        app.MapFamilyEndpoints();
        app.MapWalletEndpoints();
        app.MapCategoryEndpoints();

        return app;
    }
}
