using Domain.Entities.Families.ValueObjects;
using Domain.Entities.Families.Exceptions;
using Xunit;

namespace Domain.Tests.Families;

public class FamilyTests
{
    [Fact]
    public void FamilyName_ShouldCreate_WhenValueIsValid()
    {
        var name = FamilyName.Create("Silva");
        Assert.Equal("Silva", name.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void FamilyName_ShouldThrowFamilyNameEmptyException_WhenValueIsInvalid(string? value)
    {
        Assert.Throws<FamilyNameEmptyException>(() => FamilyName.Create(value!));
    }

    [Fact]
    public void FamilyName_ShouldThrowFamilyNameRequiredException_WhenValueIsNull()
    {
        Assert.Throws<FamilyNameRequiredException>(() => FamilyName.Create(null!));
    }

    [Fact]
    public void FamilyName_ShouldThrowFamilyNameTooLongException_WhenValueExceedsMaxLength()
    {
        var longValue = new string('a', 101);
        Assert.Throws<FamilyNameTooLongException>(() => FamilyName.Create(longValue));
    }

    [Fact]
    public void FamilyName_ShouldSupportValueEquality()
    {
        var name1 = FamilyName.Create("Silva");
        var name2 = FamilyName.Create("Silva");
        var name3 = FamilyName.Create("Santos");

        Assert.Equal(name1, name2);
        Assert.NotEqual(name1, name3);
        Assert.True(name1 == name2);
        Assert.True(name1 != name3);
    }

    [Fact]
    public void FamilyStatus_ShouldSupportValueEquality()
    {
        var status1 = FamilyStatus.Active;
        var status2 = FamilyStatus.Active;
        var status3 = FamilyStatus.Inactive;

        Assert.Equal(status1, status2);
        Assert.NotEqual(status1, status3);
        Assert.True(status1 == status2);
        Assert.True(status1 != status3);
    }

    [Fact]
    public void Constructor_ShouldInitializeFamily_WithCorrectPropertiesAndActiveStatus()
    {
        var family = new Entities.Families.Family("Silva");

        Assert.Equal(FamilyName.Create("Silva"), family.Name);
        Assert.Equal(FamilyStatus.Active, family.Status);
        Assert.NotEqual(Guid.Empty, family.Id);
        Assert.True(family.CreatedAt > DateTime.MinValue);
        Assert.Equal(default, family.UpdatedAt);
    }

    [Fact]
    public void Constructor_ShouldThrowFamilyNameRequiredException_WhenNameIsNull()
    {
        Assert.Throws<FamilyNameRequiredException>(() => new Entities.Families.Family(null!));
    }

    [Fact]
    public void UpdateName_ShouldChangeName_AndSetUpdatedAt()
    {
        var family = new Entities.Families.Family("Silva");
        
        Thread.Sleep(5); // Ensure time moves forward
        family.UpdateName("Santos");

        Assert.Equal(FamilyName.Create("Santos"), family.Name);
        Assert.True(family.UpdatedAt > DateTime.MinValue);
    }

    [Fact]
    public void Deactivate_ShouldChangeStatusToInactive_AndSetUpdatedAt()
    {
        var family = new Entities.Families.Family("Silva");

        Thread.Sleep(5);
        family.Deactivate();

        Assert.Equal(FamilyStatus.Inactive, family.Status);
        Assert.True(family.UpdatedAt > DateTime.MinValue);
    }

    [Fact]
    public void Activate_ShouldChangeStatusToActive_AndSetUpdatedAt()
    {
        var family = new Entities.Families.Family("Silva");
        family.Deactivate();
        
        var beforeActivation = family.UpdatedAt;

        Thread.Sleep(5);
        family.Activate();

        Assert.Equal(FamilyStatus.Active, family.Status);
        Assert.True(family.UpdatedAt > beforeActivation);
    }
}
