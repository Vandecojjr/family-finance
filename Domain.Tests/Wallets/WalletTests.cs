using Domain.Entities.Wallets;
using Xunit;

namespace Domain.Tests.Wallets;

public class WalletTests
{
    [Fact]
    public void Constructor_Should_Initialize_Properties()
    {
        var name = "Nubank";
        var familyId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        var wallet = new Wallet(name, ownerId);

        Assert.Equal(name, wallet.Name);
        Assert.Equal(ownerId, wallet.MemberId);
    }

    [Fact]
    public void CreatePersonal_Should_Create_Personal_Wallet()
    {
        var name = "Investimento";
        var familyId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        var wallet = Wallet.CreatePersonal(name, ownerId);

        Assert.Equal(name, wallet.Name);
        Assert.Equal(ownerId, wallet.MemberId);
    }
}
