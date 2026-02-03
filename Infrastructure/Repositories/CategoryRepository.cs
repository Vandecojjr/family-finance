using Domain.Entities.Categories;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CategoryRepository(AppDbContext context) : ICategoryRepository
{
    public async Task AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        await context.Set<Category>().AddAsync(category, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Category>> GetAllForFamilyAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        // System defaults (FamilyId == null) OR Custom for this family
        return await context.Set<Category>()
            .Where(c => c.FamilyId == null || c.FamilyId == familyId)
            .Include(c => c.SubCategories) // Load hierarchy? 
            // Note: EF Core might not load multilevel recursive automatically without explicit loading or max depth configuration or lazy loading.
            // For now, let's include direct children. If unlimited depth is needed, we might need CTEs or loading all and assembling in memory.
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
         return await context.Set<Category>()
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}
