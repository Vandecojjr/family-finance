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
        var family = new Family(command.FamilyName);
        var member = new Member(command.Name, command.Email, command.Document, family.Id);
        
        family.AddMember(member);
        await familyRepository.AddAsync(family, cancellationToken);

        var hashedPassword = passwordHasher.Hash(command.Password);
        var account = new Account(command.Email, hashedPassword, member.Id);
        await accountRepository.AddAsync(account, cancellationToken);

        return Result<Guid>.Success(account.Id);
    }
}
