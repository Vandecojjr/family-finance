using Application.Shared.Auth;
using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.Entities.Accounts;
using Domain.Entities.Families;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.Register;

public sealed class RegisterAccountHandler(
    IAccountRepository accountRepository,
    IFamilyRepository familyRepository,
    IPasswordHasher passwordHasher)
    : ICommandHandler<RegisterAccountCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(RegisterAccountCommand command, CancellationToken cancellationToken)
    {
        // 1. Create Family
        var family = new Family(command.FamilyName);
        await familyRepository.AddAsync(family, cancellationToken);

        // 2. Create Member
        var member = new Member(command.Name, command.Email, command.Document, family.Id);
        family.AddMember(member);
        
        // Use the reinforced AddMemberAsync that handles Detached state correctly (from previous fix)
        await familyRepository.AddMemberAsync(family, cancellationToken);

        // 3. Create Account
        var hashedPassword = passwordHasher.Hash(command.Password);
        var account = new Account(command.Email, hashedPassword, member.Id);
        await accountRepository.AddAsync(account, cancellationToken);

        return Result<Guid>.Success(account.Id);
    }
}
