using Domain.Entities.Families;
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

    public async Task<Family?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await context.Set<Family>()
            .Include(x => x.Members)
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
        // Assuming Member is a navigation property or direct DbSet access is possible
        // Since Member is part of Family aggregate, ideally specific to the family
        var family = await GetByIdAsync(familyId, cancellationToken);
        return family?.Members.FirstOrDefault(m => m.Id == memberId);
    }

    public async Task<Member?> GetMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default)
    {
        var family = await GetByIdAsync(familyId, cancellationToken);
        return family?.Members.FirstOrDefault(m => m.Document == document);
    }

    public async Task<bool> ExistsMemberByDocumentAsync(Guid familyId, string document, CancellationToken cancellationToken = default)
    {
        // Could query member set directly for better performance if Member is a DbSet
        return await context.Set<Member>()
            // Need to filter by family? Member has no FamilyId FK explicitly defined in entity provided in Step 143, 
            // but FamilyConfiguration (Step 241) has HasMany(Members). 
            // Wait, FamilyConfiguration says `.WithOne()`. If Member has no navigation property back to Family, 
            // EF creates a shadow FK `FamilyId`.
            // We can check if Member is in the family via navigation if we load Family, or query Members with shadow property.
            // Using Family aggregate loading is safer for DDD consistency.
            // But strict requirement "ExistsMember..." in context of a familyId implies checking within that family.
            // If I just load family:
            .AnyAsync(m => m.Document == document && EF.Property<Guid>(m, "FamilyId") == familyId, cancellationToken);
    }

    public async Task AddMemberAsync(Guid familyId, Member member, CancellationToken cancellationToken = default)
    {
        var family = await GetByIdAsync(familyId, cancellationToken);
        if (family is null) return;

        family.AddMember(member);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateMemberAsync(Guid familyId, Member member, CancellationToken cancellationToken = default)
    {
        // Assuming member object passed is already tracked or needs to be attached?
        // Usually update repo method expects entity to be updated.
        // If "member" here is a modified instance, we need to ensure context tracks it.
        context.Set<Member>().Update(member);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid familyId, Guid memberId, CancellationToken cancellationToken = default)
    {
        var family = await GetByIdAsync(familyId, cancellationToken);
        if (family is null) return;

        var memberStr = family.Members.FirstOrDefault(m => m.Id == memberId);
        if (memberStr != null)
        {
            // Family entity (Step 142) does not have RemoveMember.
            // We must remove from collection or context.
            family.Members.Remove(memberStr);
            // Or context.Remove(memberStr) if cascade delete is set (it is in config).
            // Just removing from collection might set FK null if nullable, or delete if required/cascade.
            // Config said OnDelete Cascade.
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
