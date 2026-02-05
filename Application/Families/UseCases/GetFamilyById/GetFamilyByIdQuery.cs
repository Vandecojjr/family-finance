using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.GetFamilyById;

public sealed record GetFamilyByIdQuery(Guid Id) : IQuery<Result<FamilyDto>>;

public sealed record FamilyDto(Guid Id, string Name, short NumberMember);
