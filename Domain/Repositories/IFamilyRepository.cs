using Domain.Entities.Families;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface IFamilyRepository : IRepository<Family>
{
    Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Family?> GetByIdWithMembersAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Family?> GetByNameAsync(string name, CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);

    Task AddAsync(Family family, CancellationToken cancellationToken = default);
    Task UpdateAsync(Family family, CancellationToken cancellationToken = default);

    Task<Family?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default);
    Task<Member?> GetMemberByIdAsync(Guid familyId, Guid memberId, CancellationToken cancellationToken = default);
    Task<Member?> GetMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default);
    Task<bool> ExistsMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default);
}