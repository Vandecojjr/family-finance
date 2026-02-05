using Domain.Enums;
using Domain.Shared.Entities;

namespace Domain.Entities.Accounts;

public class Role : Entity
{
    public string Name { get; private set; }
    public string Description { get; private set; }
    public ICollection<Permission> Permissions { get; private set; } = [];
    public ICollection<Account> Accounts { get; private set; } = [];

    public Role(string name, string description)
    {
        Name = name;
        Description = description;
    }

    public void AddPermission(Permission permission)
    {
        if (!Permissions.Contains(permission))
            Permissions.Add(permission);
    }

    public void RemovePermission(Permission permission)
    {
        Permissions.Remove(permission);
    }

    public static Role Admin()
    {
        var role = new Role("Admin", "Full access to all system features");
        foreach (Permission permission in Enum.GetValues(typeof(Permission)))
        {
            role.AddPermission(permission);
        }
        return role;
    }

    public static Role Member()
    {
        var role = new Role("Member", "Standard member access");
        role.AddPermission(Permission.FamilyView);
        role.AddPermission(Permission.MemberView);
        role.AddPermission(Permission.WalletView);
        role.AddPermission(Permission.WalletCreate);
        role.AddPermission(Permission.WalletUpdate);
        role.AddPermission(Permission.TransactionView);
        role.AddPermission(Permission.TransactionCreate);
        role.AddPermission(Permission.TransactionUpdate);
        return role;
    }

    public static Role Viewer()
    {
        var role = new Role("Viewer", "Read-only access");
        role.AddPermission(Permission.FamilyView);
        role.AddPermission(Permission.MemberView);
        role.AddPermission(Permission.WalletView);
        role.AddPermission(Permission.TransactionView);
        return role;
    }
}
