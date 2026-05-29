using Application.Shared.Auth;
using Application.Shared.Results;
using Application.UseCases.Families.GetFamilyById;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Families.GetMyFamily;

public sealed class GetMyFamilyQueryHandler(IFamilyRepository familyRepository, ICurrentUser currentUser)
    : IQueryHandler<GetMyFamilyQuery, Result<FamilyResponse>>
{
    public async ValueTask<Result<FamilyResponse>> Handle(
        GetMyFamilyQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);

        if (member is null)
        {
            return Result<FamilyResponse>.Failure(
                Error.NotFound("Member.NotFound", "Membro correspondente ao usuário logado não foi encontrado."));
        }

        var family = await familyRepository.GetByIdAsync(member.FamilyId, cancellationToken);

        if (family is null)
        {
            return Result<FamilyResponse>.Failure(
                Error.NotFound("Family.NotFound", $"Família com ID '{member.FamilyId}' não foi encontrada."));
        }

        return Result<FamilyResponse>.Success(family.ToResponse());
    }
}

