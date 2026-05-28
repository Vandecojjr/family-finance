using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.PlannedExpenses.CreatePlannedExpense;
using Application.UseCases.PlannedExpenses.DeletePlannedExpense;
using Application.UseCases.PlannedExpenses.GetPlannedExpenseById;
using Application.UseCases.PlannedExpenses.GetPlannedExpensesByMember;
using Application.UseCases.PlannedExpenses.Shared;
using Application.UseCases.PlannedExpenses.UpdatePlannedExpense;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class PlannedExpensesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", Create)
            .WithName("PlannedExpenses.Create")
            .WithSummary("Cria um novo gasto previsto.")
            .WithTags("PlannedExpenses")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", Update)
            .WithName("PlannedExpenses.Update")
            .WithSummary("Atualiza os dados de um gasto previsto existente.")
            .WithTags("PlannedExpenses")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/{id:guid}", GetById)
            .WithName("PlannedExpenses.GetById")
            .WithSummary("Busca um gasto previsto pelo ID.")
            .WithTags("PlannedExpenses")
            .RequireAuthorization()
            .Produces<Result<PlannedExpenseResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("PlannedExpenses.GetByMember")
            .WithSummary("Lista todos os gastos previstos de um membro da família.")
            .WithTags("PlannedExpenses")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<PlannedExpenseResponse>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/{id:guid}", Delete)
            .WithName("PlannedExpenses.Delete")
            .WithSummary("Remove definitivamente um gasto previsto.")
            .WithTags("PlannedExpenses")
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
        var command = new CreatePlannedExpenseCommand(
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
        var command = new UpdatePlannedExpenseCommand(
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
        var query = new GetPlannedExpenseByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetPlannedExpensesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Delete(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeletePlannedExpenseCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}
