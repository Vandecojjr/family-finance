using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Categories;

public class Category : Entity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public CategoryType Type { get; private set; }
    public Guid? ParentId { get; private set; }
    public Guid FamilyId { get; private set; }

    public bool IsSubcategory  => ParentId.HasValue;
    
    public virtual Category? Parent { get; private set; }
    public virtual ICollection<Category> SubCategories { get; private set; } = [];

    protected Category()
    {
    }

    public Category(string name, CategoryType type, Guid familyId, Guid? parentId = null)
    {
        Name = name;
        Type = type;
        FamilyId = familyId;
        ParentId = parentId;
    }

    public void AddSubCategory(Category subCategory)
    {
        var subCategoryExist = SubCategories.Any(m => m.Id == subCategory.Id || m.Name == subCategory.Name);
        if (subCategoryExist || subCategory.Name == Name) return;

        SubCategories.Add(subCategory);
    }

    public void Update(string name, CategoryType type, Guid? parentId = null)
    {
        Name = name;
        Type = type;
        ParentId = parentId;
    }
}
