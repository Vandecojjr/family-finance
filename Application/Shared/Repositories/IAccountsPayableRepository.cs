using Application.Shared.Objects;
using Domain.Enums;

namespace Application.Shared.Repositories;

public interface IAccountsPayableRepository
{
    Task<IReadOnlyCollection<AccountsPayableDto>>
        GetAllByFamily(Guid familyId, RecurringFrequency onlyDate, CancellationToken cancellationToken = default);
}
