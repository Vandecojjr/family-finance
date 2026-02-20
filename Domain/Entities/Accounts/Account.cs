using Domain.Entities.Families;
using Domain.Enums;
using Domain.Shared.Aggregates.Abstractions;
using Domain.Shared.Entities;

namespace Domain.Entities.Accounts;

public class Account : Entity, IAggregateRoot
{
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public AccountStatus Status { get; private set; } = AccountStatus.Active;

    public Guid MemberId { get; private set; }
    public Member? Member { get; private set; }

    public ICollection<Role> Roles { get; private set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = [];


    public Account(string email, string passwordHash, Guid memberId)
    {
        MemberId = memberId;
        Email = email;
        PasswordHash = passwordHash;
    }

    public void Activate()
    {
        Status = AccountStatus.Active;
    }

    public void Deactivate()
    {
        Status = AccountStatus.Inactive;
    }

    public void Block()
    {
        Status = AccountStatus.Blocked;
    }

    public void ChangePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }

    public void AssignMember(Guid memberId)
    {
        if (MemberId != Guid.Empty && MemberId != memberId)
            throw new InvalidOperationException("Account já está vinculada a um Member.");

        MemberId = memberId;
    }

    public void AddRefreshToken(RefreshToken token)
    {
        var exists = RefreshTokens.Any(t => t.Token == token.Token);
        if (!exists)
            RefreshTokens.Add(token);
    }

    public void ClearExpiredRefreshTokens()
    {
        var inactive = RefreshTokens.Where(t => !t.IsActive).ToList();
        foreach (var token in inactive)
        {
            RefreshTokens.Remove(token);
        }
    }

    public void RevokeRefreshToken(string token)
    {
        var refreshToken = RefreshTokens.FirstOrDefault(x => x.Token == token);
        refreshToken?.Revoke();
    }

    public void AddRole(Role role)
    {
        if (Roles.All(r => r.Id != role.Id))
            Roles.Add(role);
    }

    public void RemoveRole(Guid roleId)
    {
        var role = Roles.FirstOrDefault(r => r.Id == roleId);
        if (role != null)
            Roles.Remove(role);
    }

    public bool HasPermission(Permission permission)
    {
        return Roles.Any(r => r.Permissions.Contains(permission));
    }
}
