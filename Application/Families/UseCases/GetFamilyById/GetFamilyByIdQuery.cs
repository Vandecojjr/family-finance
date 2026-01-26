using Application.Shared.Results;
using Mediator;

namespace Application.Families.UseCases.GetFamilyById;

public sealed record GetFamilyByIdQuery(Guid Id) : IQuery<Result<FamilyDto>>;

public sealed record MemberDto(Guid Id, string Name, string Email, string Document, Guid? AccountId);

public sealed record FamilyDto(Guid Id, string Name, short NumberMember, IReadOnlyCollection<MemberDto> Members);
