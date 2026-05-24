using Api.Extensions;
using Application.Families.UseCases.GetFamilyById;
using Application.Families.UseCases.GetFamilyName;
using Application.Shared.Results;
using Mediator;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

/// <summary>
/// Endpoints para manipulação de famílias.
/// Rota base: /api/families
/// </summary>
public sealed class FamiliesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapGet("/{id:guid}", GetById)
            .WithName("Families.GetById")
            .WithSummary("Busca uma família pelo ID, retornando seus membros e status.")
            .WithTags("Families")
            .RequireAuthorization()
            .Produces<Result<FamilyResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/{id:guid}/name", GetNameById)
            .WithName("Families.GetNameById")
            .WithSummary("Busca apenas o nome de uma família pelo ID.")
            .WithTags("Families")
            .RequireAuthorization()
            .Produces<Result<FamilyNameResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<HttpResult> GetById(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetFamilyByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetNameById(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetFamilyNameByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}
