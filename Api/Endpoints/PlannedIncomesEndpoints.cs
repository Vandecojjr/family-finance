using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.PlannedIncomes.CreatePlannedIncome;
using Application.UseCases.PlannedIncomes.DeletePlannedIncome;
using Application.UseCases.PlannedIncomes.GetPlannedIncomeById;
using Application.UseCases.PlannedIncomes.GetPlannedIncomesByMember;
using Application.UseCases.PlannedIncomes.Shared;
using Application.UseCases.PlannedIncomes.UpdatePlannedIncome;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class PlannedIncomesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", Create)
            .WithName("PlannedIncomes.Create")
            .WithSummary("Cria um novo ganho previsto.")
            .WithTags("PlannedIncomes")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", Update)
            .WithName("PlannedIncomes.Update")
            .WithSummary("Atualiza os dados de um ganho previsto existente.")
            .WithTags("PlannedIncomes")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/{id:guid}", GetById)
            .WithName("PlannedIncomes.GetById")
            .WithSummary("Busca um ganho previsto pelo ID.")
            .WithTags("PlannedIncomes")
            .RequireAuthorization()
            .Produces<Result<PlannedIncomeResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("PlannedIncomes.GetByMember")
            .WithSummary("Lista todos os ganhos previstos de um membro da família.")
            .WithTags("PlannedIncomes")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<PlannedIncomeResponse>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/{id:guid}", Delete)
            .WithName("PlannedIncomes.Delete")
            .WithSummary("Remove definitivamente um ganho previsto.")
            .WithTags("PlannedIncomes")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    public record CreateRequest(
        string Description,
        decimal Amount,
        DateTime Date,
        Guid MemberId,
        Guid CategoryId);

    public record UpdateRequest(
        string Description,
        decimal Amount,
        DateTime Date,
        Guid CategoryId);

    private static async Task<HttpResult> Create(
        [FromBody] CreateRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreatePlannedIncomeCommand(
            request.Description,
            request.Amount,
            request.Date,
            request.MemberId,
            request.CategoryId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Update(
        [FromRoute] Guid id,
        [FromBody] UpdateRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new UpdatePlannedIncomeCommand(
            id,
            request.Description,
            request.Amount,
            request.Date,
            request.CategoryId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetById(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetPlannedIncomeByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetPlannedIncomesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Delete(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeletePlannedIncomeCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}
