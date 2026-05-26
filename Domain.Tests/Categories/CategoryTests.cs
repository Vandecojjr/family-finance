using Domain.Entities.Categories;
using Domain.Entities.Categories.ValueObjects;
using Domain.Entities.Categories.Exceptions;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Categories;

public class CategoryTests
{
    [Fact]
    public void CategoryName_ShouldCreate_WhenValueIsValid()
    {
        var name = CategoryName.Create("Alimentação");
        Assert.Equal("Alimentação", name.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void CategoryName_ShouldThrowCategoryNameEmptyException_WhenValueIsInvalid(string? value)
    {
        Assert.Throws<CategoryNameEmptyException>(() => CategoryName.Create(value!));
    }

    [Fact]
    public void CategoryName_ShouldThrowCategoryNameRequiredException_WhenValueIsNull()
    {
        Assert.Throws<CategoryNameRequiredException>(() => CategoryName.Create(null!));
    }

    [Fact]
    public void CategoryName_ShouldThrowCategoryNameTooLongException_WhenValueExceedsMaxLength()
    {
        var longValue = new string('a', 101);
        Assert.Throws<CategoryNameTooLongException>(() => CategoryName.Create(longValue));
    }

    [Fact]
    public void Constructor_ShouldInitializeCategory_WithCorrectProperties()
    {
        var familyId = Guid.NewGuid();
        var category = new Category("Salário", CategoryType.Income, familyId);

        Assert.Equal(CategoryName.Create("Salário"), category.Name);
        Assert.Equal(CategoryType.Income, category.Type);
        Assert.Equal(familyId, category.FamilyId);
        Assert.Null(category.ParentId);
        Assert.Null(category.Parent);
        Assert.Empty(category.SubCategories);
        Assert.NotEqual(Guid.Empty, category.Id);
        Assert.True(category.CreatedAt > DateTime.MinValue);
        Assert.Equal(default, category.UpdatedAt);
    }

    [Fact]
    public void UpdateName_ShouldChangeName_AndSetUpdatedAt()
    {
        var category = new Category("Salário", CategoryType.Income, Guid.NewGuid());
        
        Thread.Sleep(5);
        category.UpdateName("Proventos");

        Assert.Equal(CategoryName.Create("Proventos"), category.Name);
        Assert.True(category.UpdatedAt > DateTime.MinValue);
    }
}
