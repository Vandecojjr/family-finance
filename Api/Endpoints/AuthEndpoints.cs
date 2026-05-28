using Api.Extensions;
using Application.Shared.Responses;
using Application.Shared.Results;
using Application.UseCases.Accounts.Login;
using Application.UseCases.Accounts.RefreshToken;
using Application.UseCases.Accounts.RevokeToken;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

/// <summary>
/// Endpoints de autenticação: login, refresh e revogação de tokens.
/// Rota base: /api/auth
/// </summary>
public sealed class AuthEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapPost("/login", Login)
            .WithName("Auth.Login")
            .WithSummary("Autentica um usuário e retorna um par de tokens (access + refresh).")
            .WithTags("Auth")
            .AllowAnonymous()
            .Produces<Result<TokenPairResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPost("/refresh", Refresh)
            .WithName("Auth.Refresh")
            .WithSummary("Troca um refresh token válido por um novo par de tokens.")
            .WithTags("Auth")
            .AllowAnonymous()
            .Produces<Result<TokenPairResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPost("/revoke", Revoke)
            .WithName("Auth.Revoke")
            .WithSummary("Revoga um refresh token (logout).")
            .WithTags("Auth")
            .RequireAuthorization()
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    // -----------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------

    private static async Task<HttpResult> Login(
        [FromBody] LoginCommand command,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Refresh(
        [FromBody] RefreshTokenCommand command,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }

    private static async Task<HttpResult> Revoke(
        [FromBody] RevokeTokenCommand command,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.ToResult();
    }
}

