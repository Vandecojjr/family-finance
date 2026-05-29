using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.RecurringExpenses.CreateRecurringExpense;
using Application.UseCases.RecurringExpenses.DeleteRecurringExpense;
using Application.UseCases.RecurringExpenses.GetRecurringExpenseById;
using Application.UseCases.RecurringExpenses.GetRecurringExpensesByMember;
using Application.UseCases.RecurringExpenses.GetTotalFixedExpensesByMember;
using Application.UseCases.RecurringExpenses.PayRecurringExpense;
using Application.UseCases.RecurringExpenses.Shared;
using Application.UseCases.RecurringExpenses.UpdateRecurringExpense;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

/// <summary>
/// Endpoints para manipulação de gastos recorrentes.
/// Rota base: /api/recurringexpenses
/// </summary>
public sealed class RecurringExpensesEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", Create)
            .WithName("RecurringExpenses.Create")
            .WithSummary("Cria um novo gasto recorrente.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:guid}", Update)
            .WithName("RecurringExpenses.Update")
            .WithSummary("Atualiza os dados de um gasto recorrente existente.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/{id:guid}", GetById)
            .WithName("RecurringExpenses.GetById")
            .WithSummary("Busca um gasto recorrente pelo ID.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result<RecurringExpenseResponse>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("RecurringExpenses.GetByMember")
            .WithSummary("Lista todos os gastos recorrentes de um membro da família.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<RecurringExpenseResponse>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapGet("/member/{memberId:guid}/total-fixed", GetTotalFixedByMember)
            .WithName("RecurringExpenses.GetTotalFixedByMember")
            .WithSummary("Obtém a soma dos gastos recorrentes fixos e ativos de um membro da família.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result<decimal>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapDelete("/{id:guid}", Delete)
            .WithName("RecurringExpenses.Delete")
            .WithSummary("Remove definitivamente um gasto recorrente.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{id:guid}/pay", Pay)
            .WithName("RecurringExpenses.Pay")
            .WithSummary("Registra o pagamento de um gasto recorrente no mês atual.")
            .WithTags("RecurringExpenses")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    public record CreateRequest(
        string Description,
        decimal Amount,
        RecurringExpenseType Type,
        RecurringFrequency Frequency,
        int DueDay,
        DateTime StartDate,
        DateTime? EndDate,
        Guid MemberId,
        Guid CategoryId);

    public record UpdateRequest(
        string Description,
        decimal Amount,
        RecurringExpenseType Type,
        RecurringFrequency Frequency,
        int DueDay,
        DateTime StartDate,
        DateTime? EndDate,
        Guid CategoryId);

    public record PayRecurringExpenseRequest(
        Guid WalletId,
        decimal Amount,
        Guid? BankAccountId = null,
        Guid? CreditCardId = null,
        bool? UseCredit = null);

    private static async Task<HttpResult> Create(
        [FromBody] CreateRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateRecurringExpenseCommand(
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
        var command = new UpdateRecurringExpenseCommand(
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
        var query = new GetRecurringExpenseByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetRecurringExpensesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetTotalFixedByMember(
        [FromRoute] Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetTotalFixedExpensesByMemberQuery(memberId);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Delete(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteRecurringExpenseCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Pay(
        [FromRoute] Guid id,
        [FromBody] PayRecurringExpenseRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new PayRecurringExpenseCommand(
            id,
            request.WalletId,
            request.Amount,
            request.BankAccountId,
            request.CreditCardId,
            request.UseCredit);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}

