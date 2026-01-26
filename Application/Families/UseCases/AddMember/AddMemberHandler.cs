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
        {
            return Result<Guid>.Failure(new Error("FAMILY_NOT_FOUND", "Família não encontrada."));
        }

        var member = new Member(command.Name, command.Email, command.Document);

        // Persist via repositório específico de membro na família
        await _familyRepository.AddMemberAsync(command.FamilyId, member, cancellationToken);

        return Result<Guid>.Success(member.Id);
    }
}
