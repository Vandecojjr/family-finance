using Domain.Entities.Categories;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CategoryRepository(AppDbContext context) : ICategoryRepository
{
    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Category>()
            .Include(x => x.SubCategories)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Category>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var result = await context.Set<Category>()
            .Include(x => x.SubCategories)
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);

        return result.AsReadOnly();
    }

    public async Task AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        await context.Set<Category>().AddAsync(category, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Category category, CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Category category, CancellationToken cancellationToken = default)
    {
        context.Set<Category>().Remove(category);
        await context.SaveChangesAsync(cancellationToken);
    }
}
