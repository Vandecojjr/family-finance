using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.GetFamilyName;

public sealed class GetFamilyNameByIdQueryHandler(IFamilyRepository familyRepository, ICurrentUser currentUser)
    : IQueryHandler<GetFamilyNameByIdQuery, Result<FamilyNameResponse>>
{
    public async ValueTask<Result<FamilyNameResponse>> Handle(
        GetFamilyNameByIdQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);

        if (member is null || member.FamilyId != query.Id)
        {
            return Result<FamilyNameResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para acessar esta família."));
        }

        var familyName = await familyRepository.GetNameByIdAsync(query.Id, cancellationToken);

        if (familyName is null)
        {
            return Result<FamilyNameResponse>.Failure(
                Error.NotFound("Family.NotFound", $"Família com ID '{query.Id}' não foi encontrada."));
        }

        return Result<FamilyNameResponse>.Success(familyName.ToResponse());
    }
}
