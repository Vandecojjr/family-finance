using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.GetFamilyName;

public sealed class GetFamilyNameByIdQueryHandler(IFamilyRepository familyRepository)
    : IQueryHandler<GetFamilyNameByIdQuery, Result<FamilyNameResponse>>
{
    public async ValueTask<Result<FamilyNameResponse>> Handle(
        GetFamilyNameByIdQuery query,
        CancellationToken cancellationToken)
    {
        var familyName = await familyRepository.GetNameByIdAsync(query.Id, cancellationToken);

        if (familyName is null)
        {
            return Result<FamilyNameResponse>.Failure(
                Error.NotFound("Family.NotFound", $"Família com ID '{query.Id}' não foi encontrada."));
        }

        return Result<FamilyNameResponse>.Success(familyName.ToResponse());
    }
}
