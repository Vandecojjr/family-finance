using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Repositories;
using Domain.Shared.Repositories;
using Mediator;

namespace Application.UseCases.Families.UpdateTimezone;

public sealed class UpdateFamilyTimezoneCommandHandler(
    IFamilyRepository familyRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<UpdateFamilyTimezoneCommand, Result<bool>>
{
    public async ValueTask<Result<bool>> Handle(
        UpdateFamilyTimezoneCommand command,
        CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByIdAsync(command.FamilyId, cancellationToken);

        if (family is null)
            return Result<bool>.Failure(Error.NotFound("Family.NotFound", "Família não encontrada."));

        // Only allow members of the family to update it, or roles with permission
        if (currentUser.MemberId == Guid.Empty)
            return Result<bool>.Failure(Error.Forbidden("Family.Forbidden", "Você não tem permissão para alterar esta família."));
            
        var member = family.Members.FirstOrDefault(m => m.Id == currentUser.MemberId);
        if (member is null && !currentUser.Roles.Contains("SystemAdmin"))
            return Result<bool>.Failure(Error.Forbidden("Family.Forbidden", "Você não tem permissão para alterar esta família."));

        family.UpdateTimezone(command.Timezone);
        
        await familyRepository.UpdateAsync(family, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
