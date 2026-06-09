using Api.Extensions;
using Application.Shared.Objects;
using Application.Shared.Results;
using Application.UseCases.AccountsReceivable.GetMemberAccountsReceivable;
using Domain.Enums;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using HttpResult = Microsoft.AspNetCore.Http.IResult;

namespace Api.Endpoints;

public sealed class AccountsReceivableEndpoints : IEndpointGroup
{
    public void Map(RouteGroupBuilder group)
    {
        group.MapGet("/member/{memberId:guid}", GetByMember)
            .WithName("AccountsReceivable.GetByMember")
            .WithSummary("Lista as contas a receber de um membro da família.")
            .WithTags("AccountsReceivable")
            .RequireAuthorization()
            .Produces<Result<IReadOnlyCollection<AccountsReceivableDto>>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private async Task<HttpResult> GetByMember(
        [FromRoute] Guid memberId,
        [FromQuery] RecurringFrequency onlyDate,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var query = new GetMemberAccountsReceivableQuery(memberId, onlyDate);
        var result = await mediator.Send(query, cancellationToken);
        return result.ToResult();
    }
}
