using Application.Shared.Objects;
using Domain.Enums;

namespace Application.Shared.Repositories;

public interface IAccountsReceivableRepository
{
    Task<IReadOnlyCollection<AccountsReceivableDto>>
        GetAllByMember(Guid memberId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default);
}
