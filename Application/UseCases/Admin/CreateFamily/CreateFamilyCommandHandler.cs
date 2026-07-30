using Application.Shared.Auth;
using Application.Shared.Results;
using Domain.AccessContext.Entities.Accounts;
using Domain.Entities.Families;
using Domain.Entities.Members;
using Domain.Entities.Wallets;
using Domain.Enums;
using Domain.Repositories;
using Domain.Shared.Exceptions;
using Mediator;

namespace Application.UseCases.Admin.CreateFamily;

public sealed class CreateFamilyCommandHandler(
    IFamilyRepository familyRepository,
    IAccountRepository accountRepository,
    IWalletRepository walletRepository,
    ICurrentUser currentUser,
    IPasswordHasher passwordHasher) : ICommandHandler<CreateFamilyCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(
        CreateFamilyCommand command,
        CancellationToken cancellationToken)
    {
        if (!currentUser.HasPermission(Permission.SystemAdmin))
        {
            return Result<Guid>.Failure(
                Error.Failure("Authorization.AccessDenied", "Apenas administradores do sistema (Master) podem criar novas famílias."));
        }

        if (await accountRepository.ExistsByEmailAsync(command.AdminEmail, cancellationToken))
        {
            return Result<Guid>.Failure(
                Error.Validation("Account.EmailInUse", "Este email já está em uso."));
        }

        var family = new Family(command.FamilyName);
        family.AddMember(command.AdminName);
        var member = family.Members.First();
        
        var hashedPassword = passwordHasher.Hash(command.AdminPassword);
        var account = new Account(command.AdminEmail, hashedPassword, member.Id);
        
        var adminRole = await accountRepository.GetRoleByNameAsync("Admin", cancellationToken) ?? Role.Admin();
        account.AddRole(adminRole);

        var defaultWallet = new Wallet("Carteira Principal", 0m, family.Id, member.Id);

        await familyRepository.AddAsync(family, cancellationToken);
        await accountRepository.AddAsync(account, cancellationToken);
        await walletRepository.AddAsync(defaultWallet, cancellationToken);

        return Result<Guid>.Success(family.Id);
    }
}
