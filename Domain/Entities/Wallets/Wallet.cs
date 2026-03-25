using Domain.Entities.Families;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Wallets;

public class Wallet : Entity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public Guid MemberId { get; private set; }
    public virtual Member? Member { get; private set; }

    protected Wallet() { }

    public Wallet(string name, Guid memberId, decimal initialBalance = 0)
    {
        Name = name;
        MemberId = memberId;
    }
    
    public static Wallet CreatePersonal(string name, Guid ownerId, decimal initialBalance = 0)
    {
        return new Wallet(name, ownerId, initialBalance);
    }
}
