using Application.Shared.Objects;
using Domain.Enums;

namespace Application.Shared.Repositories;

public interface IAccountsPayableRepository
{
    Task<IReadOnlyCollection<AccountsPayableDto>>
        GetAllByMember(Guid memberId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default);
}