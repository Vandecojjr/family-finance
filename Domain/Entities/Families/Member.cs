using Domain.Entities.Accounts;
using Domain.Shared.Entities;

namespace Domain.Entities.Families;

public class Member : Entity
{
    public Member(string name, string email, string cpf, Guid familyId)
    {
        Name = name;
        Email = email;
        Cpf = cpf;
        FamilyId = familyId;
    }
    
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string Cpf { get; private set; }

    public Guid FamilyId { get; private set; }
    public Family? Family { get; private set; }

    public Guid? AccountId { get; private set; }
    public Account? Account { get; private set; }

    public void LinkAccount(Guid accountId)
    {
        if (AccountId.HasValue && AccountId.Value != accountId)
            throw new InvalidOperationException("Member já vinculado a uma Account.");

        AccountId = accountId;
    }
}