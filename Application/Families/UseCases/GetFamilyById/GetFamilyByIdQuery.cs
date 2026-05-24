using System;
using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.GetFamilyById;

public sealed record GetFamilyByIdQuery(Guid Id) : IQuery<Result<FamilyResponse>>;
