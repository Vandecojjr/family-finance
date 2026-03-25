using Api.Extensions;
using Application.Wallets.UseCases.CreateWallet;
using Application.Wallets.UseCases.GetMyWallets;
using Application.Wallets.UseCases.CreateAccount;
using Application.Wallets.UseCases.UpdateAccount;
using Application.Wallets.UseCases.DeleteAccount;
using Application.Wallets.UseCases.GetAccountsByWallet;
using Application.Wallets.UseCases.CreateTransaction;
using Application.Wallets.UseCases.GetTransactionsByAccount;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;

namespace Api.Endpoints;

public static class WalletEndpoints
{
    public static void MapPersonalWalletEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/personal/wallets")
            .WithTags("Wallets");
            // .RequireAuthorization();

        group.MapPost("/", async (CreateWalletCommand command, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("CreatePersonalWallet")
            .RequirePermission(Permission.WalletCreate);

        group.MapGet("/", async (CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new GetMyWalletsQuery(), cancellationToken);
                return result.ToResult();
            })
            .WithName("GetMyWallets")
            .RequirePermission(Permission.WalletView);

        group.MapPost("/{walletId:guid}/accounts", async (Guid walletId, [FromBody] CreateAccountCommand command, CancellationToken cancellationToken, IMediator mediator) =>
            {
                if (command.WalletId != walletId) return Results.BadRequest("WalletId na rota difere do corpo da requisição.");
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("CreateAccount")
            .RequirePermission(Permission.WalletCreate);

        group.MapPut("/{walletId:guid}/accounts/{accountId:guid}", async (Guid walletId, Guid accountId, [FromBody] UpdateAccountCommand command, CancellationToken cancellationToken, IMediator mediator) =>
            {
                if (command.WalletId != walletId || command.AccountId != accountId) return Results.BadRequest("Ids na rota diferem do corpo da requisição.");
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("UpdateAccount")
            .RequirePermission(Permission.WalletUpdate);

        group.MapDelete("/{walletId:guid}/accounts/{accountId:guid}", async (Guid walletId, Guid accountId, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var command = new DeleteAccountCommand(walletId, accountId);
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("DeleteAccount")
            .RequirePermission(Permission.WalletUpdate);

        group.MapGet("/{walletId:guid}/accounts", async (Guid walletId, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new GetAccountsByWalletQuery(walletId), cancellationToken);
                return result.ToResult();
            })
            .WithName("GetAccountsByWallet")
            .RequirePermission(Permission.WalletView);

        group.MapPost("/{walletId:guid}/accounts/{accountId:guid}/transactions", async (Guid walletId, Guid accountId, [FromBody] CreateTransactionCommand command, CancellationToken cancellationToken, IMediator mediator) =>
            {
                if (command.WalletId != walletId || command.AccountId != accountId) return Results.BadRequest("Ids na rota diferem do corpo da requisição.");
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("CreateTransaction")
            .RequirePermission(Permission.WalletUpdate); // Assuming creating a transaction requires WalletUpdate

        group.MapGet("/{walletId:guid}/accounts/{accountId:guid}/transactions", async (Guid walletId, Guid accountId, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new GetTransactionsByAccountQuery(walletId, accountId), cancellationToken);
                return result.ToResult();
            })
            .WithName("GetTransactionsByAccount")
            .RequirePermission(Permission.WalletView);
    }
}
