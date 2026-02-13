using Api.Extensions;
using Application.Wallets.UseCases.CreateFamilyWallet;
using Application.Wallets.UseCases.GetFamilyWallets;
using Domain.Enums;
using Mediator;

namespace Api.Endpoints.Wallets;

public static class FamilyWalletsEndpoints
{
    public static void MapFamilyWalletEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/family/wallets")
            .WithTags("Wallets")
            .RequireAuthorization();

        group.MapPost("/", async (CreateFamilyWalletCommand command, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(command, cancellationToken);
                return result.ToResult();
            })
            .WithName("CreateFamilyWallet") 
            .RequirePermission(Permission.WalletCreate);

        group.MapGet("/{id:guid}", async (Guid id, CancellationToken cancellationToken, IMediator mediator) =>
            {
                var result = await mediator.Send(new GetFamilyWalletsQuery(id), cancellationToken);
                return result.ToResult();
            })
            .WithName("GetFamilyWallets")
            .RequirePermission(Permission.WalletView);
    }
}