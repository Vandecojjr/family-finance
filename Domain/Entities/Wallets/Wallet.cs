using Domain.Entities.Families;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;

namespace Domain.Entities.Wallets;

public class Wallet : IAggregateRoot
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid FamilyId { get; private set; }
    public Guid? OwnerId { get; private set; }
    public WalletType Type { get; private set; }
    public decimal CurrentBalance { get; private set; }

    public virtual Family Family { get; private set; } = null!;
    public virtual Member? Owner { get; private set; }

    protected Wallet() { }

    public Wallet(string name, Guid familyId, WalletType type, Guid? ownerId = null, decimal currentBalance = 0)
    {
        Id = Guid.NewGuid();
        Name = name;
        FamilyId = familyId;
        Type = type;
        OwnerId = ownerId;
        CurrentBalance = currentBalance;
    }
    
    // Domain methods can be added here (e.g., UpdateBalance, etc.)
}
