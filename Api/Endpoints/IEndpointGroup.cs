namespace Api.Endpoints;

/// <summary>
/// Contrato para registrar grupos de endpoints de Minimal API.
/// Implemente esta interface em cada classe de endpoint e registre via
/// <see cref="EndpointExtensions.MapEndpoints"/>.
/// </summary>
public interface IEndpointGroup
{
    void Map(RouteGroupBuilder group);
}

