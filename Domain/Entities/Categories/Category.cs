using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;

namespace Domain.Entities.Categories;

public class Category : IAggregateRoot
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public CategoryType Type { get; private set; }
    public Guid? ParentId { get; private set; }
    public Guid? FamilyId { get; private set; } // Null = System Default
    public string Icon { get; private set; } = string.Empty;
    public string Color { get; private set; } = string.Empty;

    public virtual Category? Parent { get; private set; }
    public virtual ICollection<Category> SubCategories { get; private set; } = new List<Category>();

    // EF Core constructor
    protected Category() { }

    public Category(string name, CategoryType type, string icon, string color, Guid? familyId = null, Guid? parentId = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Type = type;
        Icon = icon;
        Color = color;
        FamilyId = familyId;
        ParentId = parentId;
    }
}
