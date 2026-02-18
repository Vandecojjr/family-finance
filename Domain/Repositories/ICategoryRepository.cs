using Domain.Entities.Categories;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task AddAsync(Category category, CancellationToken cancellationToken = default);
    Task<List<Category>> GetAllForFamilyAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsyncWithSubCategories(Guid id, CancellationToken cancellationToken = default);
    Task UpdateAsync(Category category, CancellationToken cancellationToken = default);
    Task RemoveAsync(Category category, CancellationToken cancellationToken = default);
    Task<bool> ExistParentCategoryByNameAsync(string name, Guid familyId, CancellationToken cancellationToken = default);
}
