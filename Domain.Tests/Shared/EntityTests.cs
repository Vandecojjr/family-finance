using System;
using System.Threading;
using Domain.Shared.Entities;
using Xunit;

namespace Domain.Tests.Shared;

file class TestEntity : Entity { }

public class EntityTests
{
    [Fact]
    public void Entity_ShouldInitialize_Id_And_CreatedAt()
    {
        var entity = new TestEntity();

        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.True(entity.CreatedAt > DateTime.MinValue);
        Assert.Equal(default, entity.UpdatedAt);
    }

    [Fact]
    public void SeUpdate_Should_Update_UpdatedAt()
    {
        var entity = new TestEntity();
        var before = entity.UpdatedAt;

        Thread.Sleep(5);
        entity.SeUpdate();

        Assert.NotEqual(before, entity.UpdatedAt);
        Assert.True(entity.UpdatedAt > DateTime.MinValue);
    }
}
