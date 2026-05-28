using Api.Extensions;
using Application.Shared.Objects;
using Application.Shared.Results;
using Application.UseCases.AccountsPayable.GetMemberAccountsPayable;
using Domain.Enums.Queries;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class AccountsPayableEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("AccountsPayable.GetByMember")
            .WithSummary("Lista as contas a pagar de um membro da família.")
            .WithTags("AccountsPayable")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<AccountsPayableDto>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        [FromQuery] Date onlyDate,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetMemberAccountsPayableQuery(memberId, onlyDate);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}