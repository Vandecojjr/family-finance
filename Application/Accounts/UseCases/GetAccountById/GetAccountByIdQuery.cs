using Application.Shared.Results;
using Domain.Entities.Accounts;
using Mediator;

namespace Application.Accounts.UseCases.GetAccountById;

public sealed record GetAccountByIdQuery(Guid Id) : IQuery<Result<AccountDto>>;

public sealed record AccountDto(
    Guid Id,
    string Email,
    string Status,
    Guid? MemberId
)
{
    public static AccountDto ToDto(Account account)
    {
        return new (
            account.Id,
            account.Email,
            account.Status.ToString(),
            account.MemberId
        );  
    }
}
