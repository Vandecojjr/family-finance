using Application.Families.UseCases.GetFamilyById;
using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.GetMyFamily;

public sealed record GetMyFamilyQuery() : IQuery<Result<FamilyResponse>>;
