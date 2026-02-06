using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Categories;

public class Category : Entity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public CategoryType Type { get; private set; }
    public Guid? ParentId { get; private set; }
    public Guid? FamilyId { get; private set; } 
    
    public virtual Category? Parent { get; private set; }
    public virtual ICollection<Category> SubCategories { get; private set; } = new List<Category>();

    protected Category() { }

    public Category(string name, CategoryType type, Guid? familyId = null, Guid? parentId = null)
    {
        Name = name;
        Type = type;
        FamilyId = familyId;
        ParentId = parentId;
    }
}
