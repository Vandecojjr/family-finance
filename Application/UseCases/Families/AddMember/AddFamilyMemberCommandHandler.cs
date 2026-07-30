using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.AccessContext.Entities.Accounts;
using Domain.Entities.Families;
using Domain.Entities.Members;
using Domain.Repositories;
using Mediator;

namespace Application.UseCases.Families.AddMember;

public sealed class AddFamilyMemberCommandHandler(
    IFamilyRepository familyRepository,
    ICurrentUser currentUser,
    IAccountRepository accountRepository,
    IPasswordHasher passwordHasher) 
    : ICommandHandler<AddFamilyMemberCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(AddFamilyMemberCommand command, CancellationToken cancellationToken)
    {
        var family = await familyRepository.GetByIdAsync(command.FamilyId, cancellationToken);
        
        if (family is null)
            return Result<Guid>.Failure(Error.NotFound("Family.NotFound", "Família não encontrada."));

        if (!family.Members.Any(m => m.Id == currentUser.MemberId))
            return Result<Guid>.Failure(Error.Failure("Family.AccessDenied", "Você não tem permissão para adicionar membros a esta família."));

        if (await accountRepository.ExistsByEmailAsync(command.Email, cancellationToken))
            return Result<Guid>.Failure(Error.Failure("Account.EmailAlreadyInUse", "Este email já está em uso."));

        var role = await accountRepository.GetRoleByNameAsync(command.RoleName, cancellationToken);
        if (role is null)
            return Result<Guid>.Failure(Error.NotFound("Role.NotFound", "Cargo (Role) não encontrado."));

        return await ProcessFamilyMemberAsync(family, command, role, cancellationToken);
    }

    private async Task<Result<Guid>> ProcessFamilyMemberAsync(Family family, AddFamilyMemberCommand command, Role role, CancellationToken cancellationToken)
    {
        family.AddMember(command.Name);
        
        var member = family.Members.LastOrDefault(m => m.Name.Value == command.Name);
        if (member == null)
            return Result<Guid>.Failure(Error.Failure("Family.MemberNotCreated", "Erro ao criar membro."));

        var passwordHash = passwordHasher.Hash(command.Password);
        var account = new Account(command.Email, passwordHash, member.Id);
        
        account.Activate();
        account.AddRole(role);

        await familyRepository.UpdateAsync(family, cancellationToken);
        await accountRepository.AddAsync(account, cancellationToken);
        
        return Result<Guid>.Success(member.Id);
    }
}
