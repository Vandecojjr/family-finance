using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.RecurringIncomes.CreateRecurringIncome;
using Application.UseCases.RecurringIncomes.DeleteRecurringIncome;
using Application.UseCases.RecurringIncomes.GetRecurringIncomeById;
using Application.UseCases.RecurringIncomes.GetRecurringIncomesByMember;
using Application.UseCases.RecurringIncomes.GetTotalFixedIncomesByMember;
using Application.UseCases.RecurringIncomes.Shared;
using Application.UseCases.RecurringIncomes.UpdateRecurringIncome;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

/// <summary>
/// Endpoints para manipulação de ganhos recorrentes.
/// Rota base: /api/recurringincomes
/// </summary>
public sealed class RecurringIncomesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", Create)
            .WithName("RecurringIncomes.Create")
            .WithSummary("Cria um novo ganho recorrente.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", Update)
            .WithName("RecurringIncomes.Update")
            .WithSummary("Atualiza os dados de um ganho recorrente existente.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/{id:guid}", GetById)
            .WithName("RecurringIncomes.GetById")
            .WithSummary("Busca um ganho recorrente pelo ID.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result<RecurringIncomeResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("RecurringIncomes.GetByMember")
            .WithSummary("Lista todos os ganhos recorrentes de um membro da família.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<RecurringIncomeResponse>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapGet("/member/{memberId:guid}/total-fixed", GetTotalFixedByMember)
            .WithName("RecurringIncomes.GetTotalFixedByMember")
            .WithSummary("Obtém a soma dos ganhos recorrentes fixos e ativos de um membro da família.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result<decimal>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/{id:guid}", Delete)
            .WithName("RecurringIncomes.Delete")
            .WithSummary("Remove definitivamente um ganho recorrente.")
            .WithTags("RecurringIncomes")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    public record CreateRequest(
        string Description,
        decimal Amount,
        RecurringIncomeType Type,
        RecurringFrequency Frequency,
        int DueDay,
        DateTime StartDate,
        DateTime? EndDate,
        Guid MemberId,
        Guid CategoryId);

    public record UpdateRequest(
        string Description,
        decimal Amount,
        RecurringIncomeType Type,
        RecurringFrequency Frequency,
        int DueDay,
        DateTime StartDate,
        DateTime? EndDate,
        Guid CategoryId);

    private static async Task<HttpResult> Create(
        [FromBody] CreateRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateRecurringIncomeCommand(
            request.Description,
            request.Amount,
            request.Type,
            request.Frequency,
            request.DueDay,
            request.StartDate,
            request.EndDate,
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
        var command = new UpdateRecurringIncomeCommand(
            id,
            request.Description,
            request.Amount,
            request.Type,
            request.Frequency,
            request.DueDay,
            request.StartDate,
            request.EndDate,
            request.CategoryId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetById(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetRecurringIncomeByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetRecurringIncomesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetTotalFixedByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetTotalFixedIncomesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Delete(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteRecurringIncomeCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}
