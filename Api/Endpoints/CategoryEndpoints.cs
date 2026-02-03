using Application.Categories.UseCases.GetCategories;
using Api.Extensions;
using Mediator;
using Domain.Enums;

namespace Api.Endpoints;

public static class CategoryEndpoints
{
    public static void MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/categories")
            .WithTags("Categories")
            .RequireAuthorization();

        group.MapGet("/", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new GetCategoriesQuery());
            return result.ToResult();
        })
        .WithName("GetCategories");
    }
}
