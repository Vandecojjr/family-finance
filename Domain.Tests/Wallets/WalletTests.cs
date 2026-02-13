using System;
using Domain.Entities.Wallets;
using Domain.Enums;
using Xunit;

namespace Domain.Tests.Wallets;

public class WalletTests
{
    [Fact]
    public void Constructor_Should_Initialize_Properties()
    {
        var name = "Nubank";
        var familyId = Guid.NewGuid();
        var type = WalletType.Checking;
        var ownerId = Guid.NewGuid();
        var initialBalance = 100.50m;

        var wallet = new Wallet(name, familyId, type, ownerId, initialBalance);

        Assert.Equal(name, wallet.Name);
        Assert.Equal(familyId, wallet.FamilyId);
        Assert.Equal(type, wallet.Type);
        Assert.Equal(ownerId, wallet.OwnerId);
        Assert.Equal(initialBalance, wallet.CurrentBalance);
        Assert.False(wallet.IsShared);
    }

    [Fact]
    public void CreatePersonal_Should_Create_Personal_Wallet()
    {
        var name = "Investimento";
        var familyId = Guid.NewGuid();
        var type = WalletType.Savings;
        var ownerId = Guid.NewGuid();

        var wallet = Wallet.CreatePersonal(name, familyId, type, ownerId);

        Assert.Equal(name, wallet.Name);
        Assert.Equal(ownerId, wallet.OwnerId);
        Assert.False(wallet.IsShared);
    }

    [Fact]
    public void CreateFamily_Should_Create_Shared_Wallet()
    {
        var name = "Reserva Familiar";
        var familyId = Guid.NewGuid();
        var type = WalletType.Savings;

        var wallet = Wallet.CreateFamily(name, familyId, type);

        Assert.Equal(name, wallet.Name);
        Assert.Null(wallet.OwnerId);
        Assert.True(wallet.IsShared);
    }
}
