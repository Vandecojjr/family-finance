using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.GetAccountById;

public sealed class GetAccountByIdHandler(IAccountRepository accountRepository) : IQueryHandler<GetAccountByIdQuery, Result<AccountDto>>
{
    public async ValueTask<Result<AccountDto>> Handle(GetAccountByIdQuery query, CancellationToken cancellationToken)
    {
        var account = await accountRepository.GetByIdAsync(query.Id, cancellationToken);
        return account is null 
            ? Result<AccountDto>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada.")) 
            : Result<AccountDto>.Success(AccountDto.ToDto(account));
    }
}
