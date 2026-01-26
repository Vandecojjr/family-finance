using Application.Shared.Results;
using Mediator;

namespace Application.Accounts.UseCases.GetAccountById;

public sealed record GetAccountByIdQuery(Guid Id) : IQuery<Result<AccountDto>>;

public sealed record AccountDto(
    Guid Id,
    string Username,
    string Email,
    string Status,
    Guid? MemberId
);
