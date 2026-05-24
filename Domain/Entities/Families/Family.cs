using System;
using System.Collections.Generic;
using System.Linq;
using Domain.Entities.Families.Exceptions;
using Domain.Entities.Families.ValueObjects;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;
using Domain.Entities.Members;

namespace Domain.Entities.Families;

public class Family : Entity, IAggregateRoot
{
    public FamilyName Name { get; private set; } = null!;
    public FamilyStatus Status { get; private set; } = null!;

    private readonly List<Member> _members = [];
    public virtual IReadOnlyCollection<Member> Members => _members.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Family()
    {
    }
    #pragma warning restore CS8618

    public Family(string name)
    {
        Name = FamilyName.Create(name);
        Status = FamilyStatus.Active;
    }

    public void UpdateName(string name)
    {
        Name = FamilyName.Create(name);
        SeUpdate();
    }

    public void Deactivate()
    {
        Status = FamilyStatus.Inactive;
        SeUpdate();
    }

    public void Activate()
    {
        Status = FamilyStatus.Active;
        SeUpdate();
    }

    public void AddMember(string name)
    {
        var member = new Member(name, Id);
        _members.Add(member);
        SeUpdate();
    }

    public void RemoveMember(Guid memberId)
    {
        var member = _members.FirstOrDefault(m => m.Id == memberId)
            ?? throw new MemberNotFoundException(memberId);

        _members.Remove(member);
        SeUpdate();
    }
}
