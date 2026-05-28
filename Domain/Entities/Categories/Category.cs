using Domain.Entities.Categories.ValueObjects;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Enums;

namespace Domain.Entities.Categories;

public class Category : Entity, IAggregateRoot
{
    public CategoryName Name { get; private set; } = null!;
    public CategoryType Type { get; private set; }
    public Guid FamilyId { get; private set; }
    public Guid? ParentId { get; private set; }
    
    public virtual Category? Parent { get; private set; }
    
    private readonly List<Category> _subCategories = [];
    public virtual IReadOnlyCollection<Category> SubCategories => _subCategories.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Category()
    {
    }
    #pragma warning restore CS8618

    public Category(string name, CategoryType type, Guid familyId, Guid? parentId = null)
    {
        Name = CategoryName.Create(name);
        Type = type;
        FamilyId = familyId;
        ParentId = parentId;
    }

    public void UpdateName(string name)
    {
        Name = CategoryName.Create(name);
        SeUpdate();
    }
    
    public static implicit operator string(Category category) => category.Name.Value;
}
