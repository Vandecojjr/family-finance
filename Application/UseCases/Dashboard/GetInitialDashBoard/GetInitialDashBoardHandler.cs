using Application.Shared.Auth;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Dashboard.GetInitialDashBoard;

public class GetInitialDashBoardHandler(
    IFamilyRepository familyRepository,
    IDashboardRepository dashboardRepository,
    ICurrentUser currentUser) : IQueryHandler<GetInitialDashBoardQuery, Result<GetInitialDashBoardDto>>
{
    public async ValueTask<Result<GetInitialDashBoardDto>> Handle(GetInitialDashBoardQuery query, CancellationToken cancellationToken)
    {
        var familyId = await familyRepository.GetFamilyIdByMemberIdAsync(currentUser.MemberId, cancellationToken);
        var dashboardDto = await dashboardRepository.GetInitialDashBoard(currentUser.MemberId, cancellationToken);
        return Result<GetInitialDashBoardDto>.Success(dashboardDto);
    }
}