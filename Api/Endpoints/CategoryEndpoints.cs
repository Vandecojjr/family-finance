using Application.Categories.UseCases.GetCategories;
using Application.Categories.UseCases.CreateCategory;
using Application.Categories.UseCases.UpdateCategory;
using Application.Categories.UseCases.DeleteCategory;
using Api.Extensions;
using Mediator;

namespace Api.Endpoints;

public static class CategoryEndpoints
{
    public static void MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/categories")
            .WithTags("Categories")
            .RequireAuthorization();

        group.MapGet("/", async (CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new GetCategoriesQuery(), cancellationToken);
                return result.ToResult();
            })
            .WithName("GetCategories");

        group.MapPost("/",
                async (CreateCategoryCommand command, CancellationToken cancellationToken, IMediator mediator) =>
                {
                    var result = await mediator.Send(command, cancellationToken);
                    return result.ToResult();
                })
            .WithName("CreateCategory");

        group.MapPut("/{id:guid}",
                async (Guid id, UpdateCategoryCommand command, CancellationToken cancellationToken,
                    IMediator mediator) =>
                {
                    if (id != command.Id) return Results.BadRequest();
                    var result = await mediator.Send(command, cancellationToken);
                    return result.ToResult();
                })
            .WithName("UpdateCategory");

        group.MapDelete("/{id:guid}", async (Guid id, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new DeleteCategoryCommand(id), cancellationToken);
                return result.ToResult();
            })
            .WithName("DeleteCategory");
    }
}
