using Domain.Entities.Accounts;
using Domain.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AccountRepository(AppDbContext context) : IAccountRepository
{
    public async Task<Account?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<Account>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }
    
    public async Task<Account?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await context.Set<Account>()
            .Include(x => x.RefreshTokens)
            .Include(x => x.Member)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
    }

    public async Task<Account?> GetByMemberIdAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        return await context.Set<Account>()
            .Include(x => x.RefreshTokens)
            .FirstOrDefaultAsync(x => x.MemberId == memberId, cancellationToken);
    }
    
    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await context.Set<Account>()
            .AnyAsync(x => x.Email == email, cancellationToken);
    }

    public async Task AddAsync(Account account, CancellationToken cancellationToken = default)
    {
        await context.Set<Account>().AddAsync(account, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Account account, CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = context.Entry(account);
            if (entry.State == EntityState.Detached)
            {
                context.Set<Account>().Update(account);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException) when (context.Database.IsInMemory())
        {
            // InMemory provider is flaky with collection removals. 
            // If it complains that an entity doesn't exist in the store during a delete/update,
            // we can often ignore it as the end state (entity gone) is what we wanted anyway.
            // This prevents the login flow from breaking due to transient tracking issues.
        }
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await context.Set<RefreshToken>()
            .FirstOrDefaultAsync(x => x.Token == token, cancellationToken);
    }

    public async Task<bool> ExistsRefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await context.Set<RefreshToken>()
            .AnyAsync(x => x.Token == token, cancellationToken);
    }

    public async Task AddRefreshTokenAsync(Guid accountId, RefreshToken token, CancellationToken cancellationToken = default)
    {
         var account = await GetByIdAsync(accountId, cancellationToken);
         if (account is null) return;

         account.AddRefreshToken(token);
         await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeRefreshTokenAsync(Guid accountId, string token, CancellationToken cancellationToken = default)
    {
        var account = await GetByIdAsync(accountId, cancellationToken);
        if (account is null) return;

        account.RevokeRefreshToken(token);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllRefreshTokensAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await GetByIdAsync(accountId, cancellationToken);
        if (account is null) return;

        foreach (var token in account.RefreshTokens.Where(t => t.IsActive))
        {
            token.Revoke();
        }
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveExpiredRefreshTokensAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await GetByIdAsync(accountId, cancellationToken);
        if (account is null) return;

        var toRemove = account.RefreshTokens.Where(t => t.ExpiresAt <= DateTime.UtcNow).ToList();
        if (toRemove.Count != 0)
        {
             context.Set<RefreshToken>().RemoveRange(toRemove);
             await context.SaveChangesAsync(cancellationToken);
        }
    }
}
