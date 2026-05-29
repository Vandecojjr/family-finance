using Application.Shared.Results;
using Application.UseCases.Families.GetFamilyById;
using Mediator;

namespace Application.UseCases.Families.GetMyFamily;

public sealed record GetMyFamilyQuery() : IQuery<Result<FamilyResponse>>;

