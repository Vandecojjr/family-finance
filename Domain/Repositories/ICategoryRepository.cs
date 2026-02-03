using Domain.Entities.Categories;
using Domain.Shared.Repositories;

namespace Domain.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task AddAsync(Category category, CancellationToken cancellationToken = default);
    
    // Get System Defaults + Family Custom Categories
    Task<List<Category>> GetAllForFamilyAsync(Guid familyId, CancellationToken cancellationToken = default);

    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
