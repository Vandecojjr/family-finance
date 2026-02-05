using Application.Shared.Results;
using Domain.Entities.Families;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.CreateFamily;

public sealed class CreateFamilyHandler : ICommandHandler<CreateFamilyCommand, Result<Guid>>
{
    private readonly IFamilyRepository _familyRepository;

    public CreateFamilyHandler(IFamilyRepository familyRepository)
    {
        _familyRepository = familyRepository;
    }

    public async ValueTask<Result<Guid>> Handle(CreateFamilyCommand command, CancellationToken cancellationToken)
    {
        var family = new Family(command.Name);
        await _familyRepository.AddAsync(family, cancellationToken);
        return Result<Guid>.Success(family.Id);
    }
}
