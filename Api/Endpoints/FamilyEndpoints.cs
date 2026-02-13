using Application.Families.UseCases.AddMember;
using Application.Families.UseCases.CreateFamily;
using Application.Families.UseCases.GetFamilyById;
using Api.Extensions;
using Mediator;
using Domain.Enums;

namespace Api.Endpoints;

public static class FamilyEndpoints
{
    public static void MapFamilyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/families")
            .WithTags("Families");

        group.MapPost("/", async (CreateFamilyCommand command, CancellationToken cancellationToken, IMediator mediator) =>
        {
            var result = await mediator.Send(command, cancellationToken);
            return result.ToResult();
        })
        .RequirePermission(Permission.FamilyManage)
        .WithName("CreateFamily");

        group.MapGet("/{id:guid}", async (Guid id, CancellationToken cancellationToken, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetFamilyByIdQuery(id), cancellationToken);
            return result.ToResult();
        })
        .RequirePermission(Permission.FamilyView)
        .WithName("GetFamilyById");

        group.MapPost("/{id:guid}/members", async (Guid id, CancellationToken cancellationToken, AddMemberCommand command, IMediator mediator) =>
        {
            var commandWithId = command with { FamilyId = id };
            var result = await mediator.Send(commandWithId, cancellationToken);
            return result.ToResult();
        })
        .RequirePermission(Permission.FamilyManage)
        .WithName("AddMember");
    }
}
