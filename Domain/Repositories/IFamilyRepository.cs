using System;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities.Families;
using Domain.Entities.Families.ValueObjects;
using Domain.Entities.Members;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IFamilyRepository : IRepository<Family>
{
    Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<FamilyName?> GetNameByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Family family, CancellationToken cancellationToken = default);
    Task UpdateAsync(Family family, CancellationToken cancellationToken = default);
    Task DeleteAsync(Family family, CancellationToken cancellationToken = default);

    Task<Member?> GetMemberByIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<bool> ExistsMemberByIdAsync(Guid memberId, CancellationToken cancellationToken = default);
}
