using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.GetFamilyName;

public sealed record GetFamilyNameByIdQuery(Guid Id) : IQuery<Result<FamilyNameResponse>>;
