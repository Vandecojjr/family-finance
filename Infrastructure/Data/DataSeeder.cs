using Application.Shared.Auth;
using Domain.Entities.Accounts;
using Domain.Entities.Families;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class DataSeeder(AppDbContext dbContext, IPasswordHasher passwordHasher)
{
    public async Task SeedAsync()
    {
        if (await dbContext.Set<Account>().AnyAsync())
            return;

        var family = new Family("Familia Admin");
        var member = new Member(
            "Admin User",
            "admin@familyfinance.com",
            "00000000000",
            family.Id
        );
        family.AddMember(member); 

        await dbContext.Set<Family>().AddAsync(family);
        await dbContext.SaveChangesAsync();
        
        var adminRole = Role.Admin();
        var memberRole = Role.Member();

        await dbContext.Set<Role>().AddRangeAsync(adminRole, memberRole);
        await dbContext.SaveChangesAsync();

        var passwordHash = passwordHasher.Hash("Password123!");
        var account = new Account(member.Email, passwordHash, member.Id);
        account.Activate();

        account.AddRole(adminRole);

        member.LinkAccount(account.Id);

        await dbContext.Set<Account>().AddAsync(account);
        await dbContext.SaveChangesAsync();
    }
}
