using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.GetFamilyById;

public sealed class GetFamilyByIdQueryHandler(IFamilyRepository familyRepository, ICurrentUser currentUser)
    : IQueryHandler<GetFamilyByIdQuery, Result<FamilyResponse>>
{
    public async ValueTask<Result<FamilyResponse>> Handle(
        GetFamilyByIdQuery query,
        CancellationToken cancellationToken)
    {
        var member = await familyRepository.GetMemberByIdAsync(currentUser.MemberId, cancellationToken);

        if (member is null || member.FamilyId != query.Id)
        {
            return Result<FamilyResponse>.Failure(
                Error.Failure("Family.AccessDenied", "Você não tem permissão para acessar esta família."));
        }

        var family = await familyRepository.GetByIdAsync(query.Id, cancellationToken);

        if (family is null)
        {
            return Result<FamilyResponse>.Failure(
                Error.NotFound("Family.NotFound", $"Família com ID '{query.Id}' não foi encontrada."));
        }

        return Result<FamilyResponse>.Success(family.ToResponse());
    }
}
