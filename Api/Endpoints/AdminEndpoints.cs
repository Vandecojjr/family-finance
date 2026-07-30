using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.Admin.CreateFamily;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class AdminEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/families", CreateFamily)
            .WithName("Admin.CreateFamily")
            .WithSummary("Cria uma nova família com seu primeiro usuário administrador (Apenas Master).")
            .WithTags("Admin")
            .RequireAuthorization()
            .Produces<Result<Guid>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }

    private static async Task<HttpResult> CreateFamily(
        [FromBody] CreateFamilyRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateFamilyCommand(
            request.FamilyName,
            request.AdminName,
            request.AdminEmail,
            request.AdminPassword);

        var result = await mediator.Send(command, cancellationToken);
        return result.IsSuccess 
            ? Microsoft.AspNetCore.Http.TypedResults.Created($"/api/families/{result.Value}", result)
            : result.ToResult();
    }
}

public sealed record CreateFamilyRequest(
    string FamilyName,
    string AdminName,
    string AdminEmail,
    string AdminPassword);
