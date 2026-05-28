using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Families.GetFamilyById;

public sealed record GetFamilyByIdQuery(Guid Id) : IQuery<Result<FamilyResponse>>;
