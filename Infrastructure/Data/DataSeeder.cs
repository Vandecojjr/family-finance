using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Application.Shared.Auth;
using Domain.AccessContext.Entities.Accounts;
using Domain.Entities.Families;
using Domain.Entities.Members;

namespace Infrastructure.Data;

public class DataSeeder(AppDbContext dbContext, IPasswordHasher passwordHasher)
{
    public async Task SeedAsync()
    {
        if (await dbContext.Set<Account>().AnyAsync())
            return;

        var adminRole = Role.Admin();
        var memberRole = Role.Member();
        var viewerRole = Role.Viewer();

        await dbContext.Set<Role>().AddRangeAsync(adminRole, memberRole, viewerRole);
        await dbContext.SaveChangesAsync();

        var family = new Family("Family Admin");
        await dbContext.Set<Family>().AddAsync(family);
        await dbContext.SaveChangesAsync();

        family.AddMember("Admin Member");
        await dbContext.SaveChangesAsync();

        var member = await dbContext.Set<Member>().FirstAsync();

        var passwordHash = passwordHasher.Hash("Password123!");
        var account = new Account("admin@familyfinance.com", passwordHash, member.Id);
        account.Activate();
        account.AddRole(adminRole);

        await dbContext.Set<Account>().AddAsync(account);
        await dbContext.SaveChangesAsync();
    }
}
