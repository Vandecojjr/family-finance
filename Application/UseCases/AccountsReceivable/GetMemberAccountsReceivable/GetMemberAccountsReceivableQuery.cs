using Application.Shared.Objects;
using Application.Shared.Results;
using Domain.Enums;
using Mediator;

namespace Application.UseCases.AccountsReceivable.GetMemberAccountsReceivable;

public sealed record GetMemberAccountsReceivableQuery(Guid MemberId, RecurringFrequency OnlyDate) : IQuery<Result<IReadOnlyCollection<AccountsReceivableDto>>>;
