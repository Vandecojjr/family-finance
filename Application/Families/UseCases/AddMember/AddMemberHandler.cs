using Application.Shared.Results;
using Domain.Entities.Families;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.AddMember;

public sealed class AddMemberHandler : ICommandHandler<AddMemberCommand, Result<Guid>>
{
    private readonly IFamilyRepository _familyRepository;

    public AddMemberHandler(IFamilyRepository familyRepository)
    {
        _familyRepository = familyRepository;
    }

    public async ValueTask<Result<Guid>> Handle(AddMemberCommand command, CancellationToken cancellationToken)
    {
        var family = await _familyRepository.GetByIdAsync(command.FamilyId, cancellationToken);
        if (family is null)
            return Result<Guid>.Failure(Error.NotFound("FAMILY_NOT_FOUND", "Família não encontrada."));

        var member = new Member(command.Name, command.Email, command.Document, command.FamilyId);
        family.AddMember(member);
        
        await _familyRepository.AddMemberAsync(family, cancellationToken);
        return Result<Guid>.Success(member.Id);
    }
}
