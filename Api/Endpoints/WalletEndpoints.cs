using Application.Wallets.UseCases.CreateWallet;
using Application.Wallets.UseCases.GetMyWallets;
using Api.Extensions;
using Mediator;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Endpoints;

public static class WalletEndpoints
{
    public static void MapWalletEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/wallets")
            .WithTags("Wallets")
            .RequireAuthorization(); // Ensure user is logged in at minimum

        group.MapPost("/", async (CreateWalletCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToResult();
        })
        .WithName("CreateWallet")
        .RequirePermission(Permission.WalletCreate);

        group.MapGet("/", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new GetMyWalletsQuery());
            return result.ToResult();
        })
        .WithName("GetMyWallets")
        .RequirePermission(Permission.WalletView);
    }
}
