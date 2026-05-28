using Application.Shared.Objects;
using Domain.Enums.Queries;

namespace Application.Shared.Repositories;

public interface IAccountsPayableRepository
{
    Task<IReadOnlyCollection<AccountsPayableDto>>
        GetAllByMember(Guid memberId, Date onlyDate, CancellationToken cancellationToken = default);
}