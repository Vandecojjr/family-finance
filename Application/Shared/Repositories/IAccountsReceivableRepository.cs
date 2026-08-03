using Application.Shared.Objects;
using Domain.Enums;

namespace Application.Shared.Repositories;

public interface IAccountsReceivableRepository
{
    Task<IReadOnlyCollection<AccountsReceivableDto>>
        GetAllByFamily(Guid familyId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default);
}
