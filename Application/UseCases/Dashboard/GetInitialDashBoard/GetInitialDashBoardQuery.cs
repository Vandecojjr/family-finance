using Application.Shared.Objects;
using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Dashboard.GetInitialDashBoard;

public sealed record GetInitialDashBoardQuery() : IQuery<Result<GetInitialDashBoardDto>>;