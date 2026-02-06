using Application.Shared.Results;
using Domain.Entities.Accounts;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.CreateAccount;

public sealed class CreateAccountHandler(IAccountRepository accountRepository) : ICommandHandler<CreateAccountCommand, Result<Guid>>
{
    public async ValueTask<Result<Guid>> Handle(CreateAccountCommand command, CancellationToken cancellationToken)
    {
        var account = new Account(command.Email, command.PasswordHash, command.MemberId);
        await accountRepository.AddAsync(account, cancellationToken);
        return Result<Guid>.Success(account.Id);
    }
}
