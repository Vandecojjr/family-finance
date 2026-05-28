using Api.Extensions;
using Application.Shared.Results;
using Application.UseCases.Transactions.DeleteTransaction;
using Application.UseCases.Transactions.GetTransactionsByFamily;
using Application.UseCases.Transactions.RegisterTransaction;
using Application.UseCases.Transactions.Shared;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class TransactionsEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/", RegisterTransaction)
            .WithName("Transactions.Register")
            .WithSummary("Registra uma nova transação financeira e atualiza os saldos.")
            .WithTags("Transactions")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapDelete("/{id:guid}", DeleteTransaction)
            .WithName("Transactions.Delete")
            .WithSummary("Remove/estorna uma transação financeira existente.")
            .WithTags("Transactions")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/", GetTransactions)
            .WithName("Transactions.GetAll")
            .WithSummary("Obtém o histórico de transações da família do usuário logado.")
            .WithTags("Transactions")
            .RequireAuthorization()
            .Produces<Result<List<TransactionResponse>>>();
    }

    public record RegisterTransactionRequest(
        string Description,
        decimal Amount,
        TransactionType Type,
        DateTime Date,
        Guid CategoryId,
        Guid? WalletId,
        Guid? BankAccountId,
        Guid? CreditCardId,
        bool? UseCredit,
        string? Notes);

    private static async Task<HttpResult> RegisterTransaction(
        [FromBody] RegisterTransactionRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new RegisterTransactionCommand(
            request.Description,
            request.Amount,
            request.Type,
            request.Date,
            request.CategoryId,
            request.WalletId,
            request.BankAccountId,
            request.CreditCardId,
            request.UseCredit,
            request.Notes);

        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> DeleteTransaction(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteTransactionCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetTransactions(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetTransactionsByFamilyQuery();
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}
