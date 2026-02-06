using Domain.Entities.Families;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class FamilyRepository(AppDbContext context) : IFamilyRepository
{
    public async Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Family?> GetByIdWithMembersAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .Include(f => f.Members)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Family?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .FirstOrDefaultAsync(x => x.Name == name, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .AnyAsync(x => x.Name == name, cancellationToken);
    }

    public async Task AddAsync(Family family, CancellationToken cancellationToken = default)
    {
        await context.Set<Family>().AddAsync(family, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Family family, CancellationToken cancellationToken = default)
    {
        context.Set<Family>().Update(family);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Family?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
             .Include(x => x.Members)
             .FirstOrDefaultAsync(f => f.Members.Any(m => m.Id == memberId), cancellationToken);
    }

    public async Task<Member?> GetMemberByIdAsync(Guid familyId, Guid memberId, CancellationToken cancellationToken = default)
    {
        var family = await GetByIdAsync(familyId, cancellationToken);
        return family?.Members.FirstOrDefault(m => m.Id == memberId);
    }

    public async Task<Member?> GetMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default)
    {
        var family = await GetByIdAsync(familyId, cancellationToken);
        return family?.Members.FirstOrDefault(m => m.Cpf == document);
    }

    public async Task<bool> ExistsMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default)
    {
        return await context.Set<Member>()
            .AnyAsync(m => m.Cpf == document && EF.Property<Guid>(m, "FamilyId") == familyId, cancellationToken);
    }
}
