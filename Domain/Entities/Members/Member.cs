using Domain.AccessContext.Entities.Accounts;
using Domain.Entities.Members.ValueObjects;
using Domain.Shared.Entities;
using Domain.Entities.Families;
using Domain.Entities.Expenses;
using Domain.Entities.RecurringIncomes;

namespace Domain.Entities.Members;

public class Member : Entity
{
    public MemberName Name { get; private set; } = null!;
    public Guid FamilyId { get; private set; }
    
    public Family Family { get; private set; } = null!;
    public Account? Account { get; private set; }

    private readonly List<Expense> _expenses = [];
    public virtual IReadOnlyCollection<Expense> Expenses => _expenses.AsReadOnly();

    private readonly List<RecurringIncome> _recurringIncomes = [];
    public virtual IReadOnlyCollection<RecurringIncome> RecurringIncomes => _recurringIncomes.AsReadOnly();

    #pragma warning disable CS8618 // Required for EF Core and serialization
    protected Member()
    {
    }
    #pragma warning restore CS8618

    internal Member(string name, Guid familyId)
    {
        Name = MemberName.Create(name);
        FamilyId = familyId;
    }

    public void UpdateName(string name)
    {
        Name = MemberName.Create(name);
        SeUpdate();
    }
}
