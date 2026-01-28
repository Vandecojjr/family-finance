using Application.Shared.Results;
using Domain.Entities.Families;
using Domain.Repositories;
using Mediator;

namespace Application.Families.UseCases.CreateFamily;

public sealed class CreateFamilyHandler(IFamilyRepository familyRepository) 
    : ICommandHandler<CreateFamilyCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateFamilyCommand command, CancellationToken cancellationToken)
    {
        var family = new Family(command.Name);

        await familyRepository.AddAsync(family, cancellationToken);

        return Result<Guid>.Success(family.Id);
    }
}
