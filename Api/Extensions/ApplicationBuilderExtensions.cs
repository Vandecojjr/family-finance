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

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference();
        }

        // app.UseHttpsRedirection(); // Potential cause for NetworkError if certs are not trusted

        app.MapAccountEndpoints();
        app.MapFamilyEndpoints();

        return app;
    }
}
