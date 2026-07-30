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
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                @"UPDATE ""Roles"" SET ""Permissions"" = 'FamilyView,FamilyManage,MemberView,MemberCreate,MemberUpdate,MemberDelete,WalletView,WalletCreate,WalletUpdate,WalletDelete,TransactionView,TransactionCreate,TransactionUpdate,TransactionDelete,RecurringExpenseView,RecurringExpenseCreate,RecurringExpenseUpdate,RecurringExpenseDelete,RecurringIncomeView,RecurringIncomeCreate,RecurringIncomeUpdate,RecurringIncomeDelete,CategoryView,CategoryCreate' WHERE ""Name"" = 'Admin';"
            );
            await dbContext.Database.ExecuteSqlRawAsync(
                @"UPDATE ""Roles"" SET ""Permissions"" = 'FamilyView,MemberView,WalletView,WalletCreate,WalletUpdate,TransactionView,TransactionCreate,TransactionUpdate,RecurringExpenseView,RecurringExpenseCreate,RecurringExpenseUpdate,RecurringExpenseDelete,RecurringIncomeView,RecurringIncomeCreate,RecurringIncomeUpdate,RecurringIncomeDelete,CategoryView' WHERE ""Name"" = 'Member';"
            );
            await dbContext.Database.ExecuteSqlRawAsync(
                @"UPDATE ""Roles"" SET ""Permissions"" = 'FamilyView,MemberView,WalletView,TransactionView,RecurringExpenseView,RecurringIncomeView,CategoryView' WHERE ""Name"" = 'Viewer';"
            );
            
            var hasMasterRole = await dbContext.Set<Role>().AnyAsync(r => r.Name == "Master");
            Role existingMasterRole;
            if (!hasMasterRole)
            {
                existingMasterRole = Role.Master();
                await dbContext.Set<Role>().AddAsync(existingMasterRole);
                await dbContext.SaveChangesAsync();
            }
            else
            {
                existingMasterRole = await dbContext.Set<Role>().FirstAsync(r => r.Name == "Master");
            }

            var masterEmail = Domain.AccessContext.Entities.Accounts.ValueObjects.Email.Create("master@familyfinance.com");
            var hasMasterUser = await dbContext.Set<Account>().AnyAsync(a => a.Email == masterEmail);
            if (!hasMasterUser)
            {
                var newMasterAccount = new Account("master@familyfinance.com", passwordHasher.Hash("Master123!"), null);
                newMasterAccount.Activate();
                newMasterAccount.AddRole(existingMasterRole);
                await dbContext.Set<Account>().AddAsync(newMasterAccount);
                await dbContext.SaveChangesAsync();
            }

            return;
        }

        var adminRole = Role.Admin();
        var memberRole = Role.Member();
        var viewerRole = Role.Viewer();
        var masterRole = Role.Master();

        await dbContext.Set<Role>().AddRangeAsync(adminRole, memberRole, viewerRole, masterRole);
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

        var masterAccount = new Account("master@familyfinance.com", passwordHasher.Hash("Master123!"), null);
        masterAccount.Activate();
        masterAccount.AddRole(masterRole);

        await dbContext.Set<Account>().AddAsync(masterAccount);

        await dbContext.SaveChangesAsync();
    }
}

