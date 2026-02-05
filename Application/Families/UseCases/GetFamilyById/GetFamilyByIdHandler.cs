using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.GetFamilyById;

public sealed class GetFamilyByIdHandler : IQueryHandler<GetFamilyByIdQuery, Result<FamilyDto>>
{
    private readonly IFamilyRepository _familyRepository;

    public GetFamilyByIdHandler(IFamilyRepository familyRepository)
    {
        _familyRepository = familyRepository;
    }

    public async ValueTask<Result<FamilyDto>> Handle(GetFamilyByIdQuery query, CancellationToken cancellationToken)
    {
        var family = await _familyRepository.GetByIdAsync(query.Id, cancellationToken);
        if (family is null)
            return Result<FamilyDto>.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));
        
        var dto = new FamilyDto(family.Id, family.Name, family.NumberMember);
        return Result<FamilyDto>.Success(dto);
    }
}
