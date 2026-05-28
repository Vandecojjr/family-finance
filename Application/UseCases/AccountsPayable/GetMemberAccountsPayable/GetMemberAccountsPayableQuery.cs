using Application.Shared.Objects;
using Application.Shared.Results;
using Domain.Enums.Queries;
using Mediator;

namespace Application.UseCases.AccountsPayable.GetMemberAccountsPayable;

public sealed record GetMemberAccountsPayableQuery(Guid MemberId, Date OnlyDate) : IQuery<Result<IReadOnlyCollection<AccountsPayableDto>>>;

