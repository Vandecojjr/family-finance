using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.Categories.CreateCategory;
using Application.UseCases.Categories.ListCategories;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

/// <summary>
/// Endpoints para manipulação de categorias e subcategorias.
/// Rota base: /api/categories
/// </summary>
public sealed class CategoriesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", CreateCategory)
            .WithName("Categories.Create")
            .WithSummary("Cria uma nova categoria ou subcategoria.")
            .WithTags("Categories")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/", ListCategories)
            .WithName("Categories.List")
            .WithSummary("Lista todas as categorias e subcategorias de forma hierárquica.")
            .WithTags("Categories")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<CategoryResponse>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }

    private static async Task<HttpResult> CreateCategory(
        [FromBody] CreateCategoryRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateCategoryCommand(
            request.Name,
            request.Type,
            request.ParentId);

        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> ListCategories(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new ListCategoriesQuery();
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}

/// <summary>
/// Contrato para requisição de criação de categoria.
/// </summary>
public sealed record CreateCategoryRequest(
    string Name,
    CategoryType Type,
    Guid? ParentId = null);
