using Application.Shared.Results;
using Domain.Repositories;
using Mediator;

namespace Application.Accounts.UseCases.GetAccountById;

public sealed class GetAccountByIdHandler : IQueryHandler<GetAccountByIdQuery, Result<AccountDto>>
{
    private readonly IAccountRepository _accountRepository;

    public GetAccountByIdHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async ValueTask<Result<AccountDto>> Handle(GetAccountByIdQuery query, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetByIdAsync(query.Id, cancellationToken);
        if (account is null)
        {
            return Result<AccountDto>.Failure(Error.NotFound("ACCOUNT_NOT_FOUND", "Conta não encontrada."));
        }

        var dto = new AccountDto(
            account.Id,
            account.Username,
            account.Email,
            account.Status.ToString(),
            account.MemberId == Guid.Empty ? null : account.MemberId
        );

        return Result<AccountDto>.Success(dto);
    }
}
