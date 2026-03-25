using Api.Extensions;
using Application.Wallets.UseCases.CreateWallet;
using Application.Wallets.UseCases.GetMyWallets;
using Domain.Enums;
using Mediator;

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
    }
}
