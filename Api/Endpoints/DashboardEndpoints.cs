using Api.Extensions;
using Application.Shared.Objects;
using Application.Shared.Results;
using Application.UseCases.Dashboard.GetInitialDashBoard;
using Mediator;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class DashboardEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapGet("/", GetInitialDashboard)
            .WithName("Dashboard.GetInitialDashboard")
            .WithSummary("Obtém os dados consolidados do dashboard do membro logado.")
            .WithTags("Dashboard")
            .RequireAuthorization()
            .Produces<Result<GetInitialDashBoardDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private static async Task<HttpResult> GetInitialDashboard(
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetInitialDashBoardQuery();
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}
