using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Families.UpdateTimezone;

public sealed record UpdateFamilyTimezoneCommand(Guid FamilyId, string Timezone) : ICommand<Result<bool>>;
