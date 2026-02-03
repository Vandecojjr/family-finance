using Application.Accounts.UseCases.CreateAccount;
using Application.Accounts.UseCases.GetAccountById;
using Application.Accounts.UseCases.Login;
using Application.Accounts.UseCases.RefreshToken;
using Application.Accounts.UseCases.Register;
using Api.Extensions;
using Mediator;

namespace Api.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/v1/accounts")
            .WithTags("Accounts");

        group.MapPost("/register", async (RegisterAccountCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToResult();
        })
        .WithName("RegisterAccount");

        group.MapPost("/", async (CreateAccountCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToResult();
        })
        .WithName("CreateAccount");

        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var result = await mediator.Send(new GetAccountByIdQuery(id));
            return result.ToResult();
        })
        .WithName("GetAccountById");

        group.MapPost("/login", async (LoginCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToResult();
        })
        .WithName("Login");

        group.MapPost("/refresh-token", async (RefreshTokenCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToResult();
        })
        .WithName("RefreshToken");
    }
}
