using System;
using Domain.Entities.Families;
using Xunit;

namespace Domain.Tests.Families;

public class MemberTests
{
    [Fact]
    public void Constructor_Should_Set_Properties()
    {
        var m = new Member("Alice", "alice@mail.com", "DOC-1");

        Assert.Equal("Alice", m.Name);
        Assert.Equal("alice@mail.com", m.Email);
        Assert.Equal("DOC-1", m.Document);
        Assert.Null(m.AccountId);
    }

    [Fact]
    public void LinkAccount_Should_Set_AccountId_First_Time()
    {
        var m = new Member("Bob", "bob@mail.com", "DOC-2");
        var id = Guid.NewGuid();

        m.LinkAccount(id);

        Assert.Equal(id, m.AccountId);
    }

    [Fact]
    public void LinkAccount_Should_Allow_Same_Id_And_Throw_If_Different()
    {
        var m = new Member("Carol", "carol@mail.com", "DOC-3");
        var id = Guid.NewGuid();
        m.LinkAccount(id);

        m.LinkAccount(id);

        var other = Guid.NewGuid();
        Assert.Throws<InvalidOperationException>(() => m.LinkAccount(other));
    }
}
