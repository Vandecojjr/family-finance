using Application.Categories.UseCases.GetCategories;
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
    }
}
