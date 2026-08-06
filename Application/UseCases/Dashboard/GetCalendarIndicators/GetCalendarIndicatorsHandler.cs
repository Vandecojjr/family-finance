using Application.Shared.Auth;
using Application.Shared.Objects;
using Application.Shared.Repositories;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Dashboard.GetCalendarIndicators;

public class GetCalendarIndicatorsHandler(
    IFamilyRepository familyRepository,
    IDashboardRepository dashboardRepository,
    ICurrentUser currentUser) : IQueryHandler<GetCalendarIndicatorsQuery, Result<List<CalendarIndicatorDto>>>
{
    public async ValueTask<Result<List<CalendarIndicatorDto>>> Handle(GetCalendarIndicatorsQuery request, CancellationToken cancellationToken)
    {
        if (!DateTime.TryParse($"{request.Month}-01", out var date))
        {
            return Result<List<CalendarIndicatorDto>>.Failure(Error.Validation("Dashboard.InvalidMonth", "Formato de mês inválido. Use YYYY-MM."));
        }

        var familyId = await familyRepository.GetFamilyIdByMemberIdAsync(currentUser.MemberId, cancellationToken);
        var dashboardDto = await dashboardRepository.GetCalendarIndicatorsAsync(familyId, date.Year, date.Month, cancellationToken);
        return Result<List<CalendarIndicatorDto>>.Success(dashboardDto);
    }
}
