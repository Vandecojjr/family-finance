using Domain.Entities.Families;
using Domain.Entities.Families.Exceptions;
using Domain.Entities.Members.ValueObjects;
using Domain.Entities.Members.Exceptions;
using Xunit;

namespace Domain.Tests.Members;

public class MemberTests
{
    [Fact]
    public void MemberName_ShouldCreate_WhenValueIsValid()
    {
        var name = MemberName.Create("John Doe");
        Assert.Equal("John Doe", name.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void MemberName_ShouldThrowMemberNameEmptyException_WhenValueIsWhitespaceOrEmpty(string value)
    {
        Assert.Throws<MemberNameEmptyException>(() => MemberName.Create(value));
    }

    [Fact]
    public void MemberName_ShouldThrowMemberNameRequiredException_WhenValueIsNull()
    {
        Assert.Throws<MemberNameRequiredException>(() => MemberName.Create(null!));
    }

    [Fact]
    public void MemberName_ShouldThrowMemberNameTooLongException_WhenValueExceedsMaxLength()
    {
        var longValue = new string('x', 101);
        Assert.Throws<MemberNameTooLongException>(() => MemberName.Create(longValue));
    }

    [Fact]
    public void Family_ShouldAddMember_AndInitializeCorrectly()
    {
        var family = new Family("Silva");
        
        family.AddMember("John Doe");

        Assert.Single(family.Members);
        var member = family.Members.First();
        Assert.Equal(MemberName.Create("John Doe"), member.Name);
        Assert.Equal(family.Id, member.FamilyId);
        Assert.NotEqual(Guid.Empty, member.Id);
    }

    [Fact]
    public void Member_ShouldUpdateName_WhenUpdateNameIsCalledDirectly()
    {
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();

        member.UpdateName("Jane Doe");

        Assert.Equal(MemberName.Create("Jane Doe"), member.Name);
    }

    [Fact]
    public void Family_ShouldRemoveMember_WhenMemberExists()
    {
        var family = new Family("Silva");
        family.AddMember("John Doe");
        var member = family.Members.First();

        family.RemoveMember(member.Id);

        Assert.Empty(family.Members);
    }

    [Fact]
    public void Family_ShouldThrowMemberNotFoundException_OnRemove_WhenMemberDoesNotExist()
    {
        var family = new Family("Silva");
        
        Assert.Throws<MemberNotFoundException>(() => family.RemoveMember(Guid.NewGuid()));
    }
}


