using Api.Extensions;
using Application.Wallets.UseCases.CreateWallet;
using Application.Wallets.UseCases.UpdateWallet;
using Application.Wallets.UseCases.DeleteWallet;
using Application.Wallets.UseCases.GetWalletById;
using Application.Wallets.UseCases.GetWalletsByFamily;
using Application.Wallets.UseCases.CreateBankAccount;
using Application.Wallets.UseCases.UpdateBankAccount;
using Application.Wallets.UseCases.DeleteBankAccount;
using Application.Wallets.UseCases.CreateCreditCard;
using Application.Wallets.UseCases.DeleteCreditCard;
using Application.Wallets.UseCases.Shared;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class WalletsEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        // Wallets
        group.MapPost("/", CreateWallet)
            .WithName("Wallets.Create")
            .WithSummary("Cria uma nova carteira.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}", UpdateWallet)
            .WithName("Wallets.Update")
            .WithSummary("Atualiza uma carteira existente.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteWallet)
            .WithName("Wallets.Delete")
            .WithSummary("Remove uma carteira.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapGet("/", GetWallets)
            .WithName("Wallets.GetAll")
            .WithSummary("Lista as carteiras da família do usuário logado.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result<List<WalletResponse>>>();

        group.MapGet("/{id:guid}", GetWalletById)
            .WithName("Wallets.GetById")
            .WithSummary("Busca uma carteira pelo ID.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result<WalletResponse>>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        // Bank Accounts
        group.MapPost("/{walletId:guid}/accounts", CreateBankAccount)
            .WithName("Wallets.CreateAccount")
            .WithSummary("Cria uma nova conta bancária na carteira.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{walletId:guid}/accounts/{accountId:guid}", UpdateBankAccount)
            .WithName("Wallets.UpdateAccount")
            .WithSummary("Edita uma conta bancária existente na carteira.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{walletId:guid}/accounts/{accountId:guid}", DeleteBankAccount)
            .WithName("Wallets.DeleteAccount")
            .WithSummary("Remove uma conta bancária da carteira.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // Credit Cards
        group.MapPost("/{walletId:guid}/accounts/{accountId:guid}/cards", CreateCreditCard)
            .WithName("Wallets.CreateCreditCard")
            .WithSummary("Cria um cartão de crédito vinculado a uma conta bancária.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result<Guid>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{walletId:guid}/accounts/{accountId:guid}/cards/{cardId:guid}", DeleteCreditCard)
            .WithName("Wallets.DeleteCreditCard")
            .WithSummary("Remove um cartão de crédito vinculado a uma conta bancária.")
            .WithTags("Wallets")
            .RequireAuthorization()
            .Produces<Result>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    public record CreateWalletRequest(string Name, decimal CashBalance);
    public record UpdateWalletRequest(string Name, decimal CashBalance);

    public record CreateAccountRequest(
        string BankName,
        AccountType Type,
        decimal DebitBalance,
        decimal CreditLimit);

    public record UpdateAccountRequest(
        string BankName,
        AccountType Type,
        decimal DebitBalance,
        decimal CreditLimit);

    public record CreateCreditCardRequest(
        string Brand,
        string LastFourDigits,
        decimal TotalLimit);

    private static async Task<HttpResult> CreateWallet(
        [FromBody] CreateWalletRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateWalletCommand(request.Name, request.CashBalance);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> UpdateWallet(
        [FromRoute] Guid id,
        [FromBody] UpdateWalletRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new UpdateWalletCommand(id, request.Name, request.CashBalance);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> DeleteWallet(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteWalletCommand(id);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetWallets(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetWalletsByFamilyQuery();
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> GetWalletById(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetWalletByIdQuery(id);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> CreateBankAccount(
        [FromRoute] Guid walletId,
        [FromBody] CreateAccountRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateBankAccountCommand(
            walletId,
            request.BankName,
            request.Type,
            request.DebitBalance,
            request.CreditLimit);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> UpdateBankAccount(
        [FromRoute] Guid walletId,
        [FromRoute] Guid accountId,
        [FromBody] UpdateAccountRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new UpdateBankAccountCommand(
            walletId,
            accountId,
            request.BankName,
            request.Type,
            request.DebitBalance,
            request.CreditLimit);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> DeleteBankAccount(
        [FromRoute] Guid walletId,
        [FromRoute] Guid accountId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteBankAccountCommand(walletId, accountId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> CreateCreditCard(
        [FromRoute] Guid walletId,
        [FromRoute] Guid accountId,
        [FromBody] CreateCreditCardRequest request,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new CreateCreditCardCommand(
            walletId,
            accountId,
            request.Brand,
            request.LastFourDigits,
            request.TotalLimit);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> DeleteCreditCard(
        [FromRoute] Guid walletId,
        [FromRoute] Guid accountId,
        [FromRoute] Guid cardId,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var command = new DeleteCreditCardCommand(walletId, accountId, cardId);
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}
