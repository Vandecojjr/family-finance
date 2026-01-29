using System;
using System.Linq;
using Domain.Entities.Accounts;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Accounts;

public class AccountTests
{
    [Fact]
    public void Constructor_Should_Set_Properties_And_Default_Status_Active()
    {
        var acc = new Account("user", "u@mail.com", "hash");

        Assert.Equal("user", acc.Username);
        Assert.Equal("u@mail.com", acc.Email);
        Assert.Equal("hash", acc.PasswordHash);
        Assert.Equal(AccountStatus.Active, acc.Status);
        Assert.Empty(acc.RefreshTokens);
        Assert.Equal(Guid.Empty, acc.MemberId);
    }

    [Fact]
    public void Activate_Deactivate_Block_Should_Change_Status()
    {
        var acc = new Account("user", "u@mail.com", "hash");

        acc.Deactivate();
        Assert.Equal(AccountStatus.Inactive, acc.Status);

        acc.Activate();
        Assert.Equal(AccountStatus.Active, acc.Status);

        acc.Block();
        Assert.Equal(AccountStatus.Blocked, acc.Status);
    }

    [Fact]
    public void ChangePassword_Should_Update_Hash()
    {
        var acc = new Account("user", "u@mail.com", "old");
        acc.ChangePassword("new");
        Assert.Equal("new", acc.PasswordHash);
    }

    [Fact]
    public void AssignMember_Should_Set_First_Time_Allow_Same_And_Throw_On_Different()
    {
        var acc = new Account("user", "u@mail.com", "hash");
        var memberId = Guid.NewGuid();

        acc.AssignMember(memberId);
        Assert.Equal(memberId, acc.MemberId);

        acc.AssignMember(memberId);

        var other = Guid.NewGuid();
        Assert.Throws<InvalidOperationException>(() => acc.AssignMember(other));
    }

    [Fact]
    public void AddRefreshToken_Should_Add_And_Not_Duplicate_By_Token()
    {
        var acc = new Account("user", "u@mail.com", "hash");
        var accountId = Guid.NewGuid();
        var t1 = new RefreshToken(accountId, "token-1", DateTime.UtcNow.AddHours(1));
        var duplicate = new RefreshToken(accountId, "token-1", DateTime.UtcNow.AddHours(2));

        acc.AddRefreshToken(t1);
        acc.AddRefreshToken(duplicate);

        Assert.Single(acc.RefreshTokens);
        Assert.Equal("token-1", acc.RefreshTokens.First().Token);
    }

    [Fact]
    public void RevokeRefreshToken_Should_Set_RevokedAt()
    {
        var acc = new Account("user", "u@mail.com", "hash");
        var t1 = new RefreshToken(acc.Id, "token-1", DateTime.UtcNow.AddHours(1));
        acc.AddRefreshToken(t1);

        acc.RevokeRefreshToken("token-1");

        var token = acc.RefreshTokens.First();
        Assert.NotNull(token.RevokedAt);
        Assert.False(token.IsActive);
    }
}
