using System;
using Domain.Entities.Families;
using Xunit;

namespace Domain.Tests.Families;

public class FamilyTests
{
    [Fact]
    public void AddMember_Should_Add_When_Not_Exists()
    {
        var family = new Family();
        var member = new Member("Alice", "alice@mail.com", "DOC-1");

        family.AddMember(member);

        Assert.Single(family.Members);
        Assert.Contains(member, family.Members);
    }

    [Fact]
    public void AddMember_Should_Not_Duplicate_By_Id()
    {
        var family = new Family();
        var member1 = new Member("Bob", "bob@mail.com", "DOC-2");

        family.AddMember(member1);
        family.AddMember(member1);

        Assert.Single(family.Members);
        Assert.Contains(member1, family.Members);
    }

    [Fact]
    public void AddMember_Should_Not_Duplicate_By_Document()
    {
        var family = new Family();
        var member1 = new Member("Carol", "carol@mail.com", "DOC-4");
        var duplicateByDocument = new Member("Caroline", "caroline@mail.com", "DOC-4");

        family.AddMember(member1);
        family.AddMember(duplicateByDocument);

        Assert.Single(family.Members);
        Assert.Contains(member1, family.Members);
    }
}
