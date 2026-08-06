using Application.Shared.Objects;
using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Dashboard.GetCalendarIndicators;

public record GetCalendarIndicatorsQuery(string Month) : IQuery<Result<List<CalendarIndicatorDto>>>;
