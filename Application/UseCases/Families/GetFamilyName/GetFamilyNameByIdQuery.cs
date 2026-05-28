using Application.Shared.Results;
using Mediator;

namespace Application.UseCases.Families.GetFamilyName;

public sealed record GetFamilyNameByIdQuery(Guid Id) : IQuery<Result<FamilyNameResponse>>;
