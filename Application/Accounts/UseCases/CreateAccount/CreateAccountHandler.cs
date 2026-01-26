using Application.Shared.Results;
using Domain.Entities.Accounts;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.CreateAccount;

public sealed class CreateAccountHandler : ICommandHandler<CreateAccountCommand, Result<Guid>>
{
    private readonly IAccountRepository _accountRepository;

    public CreateAccountHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async ValueTask<Result<Guid>> Handle(CreateAccountCommand command, CancellationToken cancellationToken)
    {
        var account = command.MemberId.HasValue
            ? new Account(command.Username, command.Email, command.PasswordHash, command.MemberId.Value)
            : new Account(command.Username, command.Email, command.PasswordHash);

        await _accountRepository.AddAsync(account, cancellationToken);

        return Result<Guid>.Success(account.Id);
    }
}
