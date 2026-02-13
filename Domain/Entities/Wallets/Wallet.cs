using Domain.Entities.Families;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Wallet : Entity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public Guid FamilyId { get; private set; }
    public Guid? OwnerId { get; private set; }
    public WalletType Type { get; private set; }
    public decimal CurrentBalance { get; private set; }

    public virtual Family Family { get; private set; }
    public virtual Member? Owner { get; private set; }

    public bool IsShared => OwnerId is null;

    protected Wallet() { }

    public Wallet(string name, Guid familyId, WalletType type, Guid? ownerId = null, decimal initialBalance = 0)
    {
        Name = name;
        FamilyId = familyId;
        Type = type;
        OwnerId = ownerId;
        CurrentBalance = initialBalance;
    }
    
    public static Wallet CreatePersonal(string name, Guid familyId, WalletType type, Guid? ownerId = null, decimal initialBalance = 0)
    {
        return new Wallet(name, familyId, type, ownerId, initialBalance);
    }
    
    public static Wallet CreateFamily(string name, Guid familyId, WalletType type, decimal initialBalance = 0)
    {
        return new Wallet(name, familyId, type, null, initialBalance);
    }
}
