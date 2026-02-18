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
        return await context.Set<Category>()
            .Where(c => c.FamilyId == null || c.FamilyId == familyId)
            .Include(c => c.SubCategories)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsyncWithSubCategories(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Category>()
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(Category category, CancellationToken cancellationToken = default)
    {
        context.Set<Category>().Update(category);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Category category, CancellationToken cancellationToken = default)
    {
        context.Set<Category>().Remove(category);
        await context.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistParentCategoryByNameAsync(string name, Guid familyId, CancellationToken cancellationToken = default)
    {
        return context.Set<Category>()
            .AnyAsync(c => c.Name == name && c.FamilyId == familyId && c.IsSubcategory == false, cancellationToken);
    }
}
