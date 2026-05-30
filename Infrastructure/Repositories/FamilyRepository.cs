using Domain.Entities.Families;
using Domain.Entities.Families.ValueObjects;
using Domain.Entities.Members;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class FamilyRepository(AppDbContext context) : IFamilyRepository
{
    public async Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .Include(x => x.Members)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<FamilyName?> GetNameByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .Where(x => x.Id == id)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(Family family, CancellationToken cancellationToken = default)
    {
        await context.Set<Family>().AddAsync(family, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Family family, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Family family, CancellationToken cancellationToken = default)
    {
        context.Set<Family>().Remove(family);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Member?> GetMemberByIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Member>()
            .FirstOrDefaultAsync(x => x.Id == memberId, cancellationToken);
    }

    public async Task<bool> ExistsMemberByIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Member>()
            .AnyAsync(x => x.Id == memberId, cancellationToken);
    }

    public async Task<Guid> GetFamilyIdByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Member>()
            .Where(x => x.Id == memberId)
            .Select(x => x.FamilyId)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
