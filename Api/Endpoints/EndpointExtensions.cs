using System.Reflection;

namespace Api.Endpoints;

/// <summary>
/// Extension method para registrar automaticamente todos os <see cref="IEndpointGroup"/>
/// encontrados no assembly da API.
/// </summary>
public static class EndpointExtensions
{
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var endpointGroupTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false }
                        && t.IsAssignableTo(typeof(IEndpointGroup)));

        foreach (var type in endpointGroupTypes)
        {
            if (Activator.CreateInstance(type) is IEndpointGroup instance)
            {
                // Usa o nome da classe como prefixo de rota por convenção
                var prefix = $"/api/{type.Name.Replace("Endpoints", string.Empty).ToLowerInvariant()}";
                var group = app.MapGroup(prefix);
                instance.Map(group);
            }
        }

        return app;
    }
}

