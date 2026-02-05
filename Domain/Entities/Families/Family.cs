using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Families;

public class Family : Entity, IAggregateRoot
{
    public Family(string name)
    {
        Name = name;
        NumberMember = 0;
    }

    public string Name { get; private set; }
    public short NumberMember { get; private set; }
    
    public ICollection<Member> Members { get; private set; } = [];

    public void AddMember(Member member)
    {
        var memberExist = Members.Any(m => m.Id == member.Id || m.Cpf == member.Cpf);
        if (memberExist) return;
        
        Members.Add(member);
        NumberMember++;
    }
}