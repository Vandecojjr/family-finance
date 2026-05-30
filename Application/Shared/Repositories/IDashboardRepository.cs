using Application.Shared.Objects;

namespace Application.Shared.Repositories;

public interface IDashboardRepository
{
    Task<GetInitialDashBoardDto> GetInitialDashBoard(Guid memberId, CancellationToken cancellationToken = default);
}