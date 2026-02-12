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
        // Garante que o banco exista
        // await dbContext.Database.EnsureCreatedAsync(); 
        // Em um cenário com migrações, EnsureCreated pode não ser ideal, mas para "mocks" rápidos pode servir.
        // O ideal é assumir que as migrações já rodaram via 'dotnet ef database update' ou similar.

        if (await dbContext.Set<Account>().AnyAsync())
        {
            return;
        }

        var family = new Family("Familia Admin");

        var member = new Member(
            "Admin User",
            "admin@familyfinance.com",
            "00000000000",
            Guid.Empty // FamilyId será ajustado pelo EF ou manualmente após salvar Family se não estiver configurado cascade/nav corretamente na criação
        );

        // Ajuste para criar o grafo corretamente, dependendo de como as entidades se relacionam.
        // O construtor do Member exige FamilyId. Vamos criar a família primeiro.

        await dbContext.Set<Family>().AddAsync(family);
        // Salvar para gerar ID se for gerado pelo banco, ou usar o ID gerado pelo EF se for Guid no client.
        // Assumindo Guid gerado no client ou pelo EF antes do save. 
        // As entidades parecem herdar de Entity que provavelmente tem Id.

        // Vamos forçar IDs para garantir links corretos se necessário, ou confiar no EF.
        // Melhor salvar Family primeiro para ter certeza do ID.
        await dbContext.SaveChangesAsync();

        // Recriar member com ID correto da família
        member = new Member(
            "Admin User",
            "admin@familyfinance.com",
            "00000000000",
            family.Id
        );
        family.AddMember(member); // Opcional se a relação for gerenciada apenas pelo FK

        await dbContext.Set<Member>().AddAsync(member);
        await dbContext.SaveChangesAsync();

        // Create Roles
        var adminRole = Role.Admin();
        var memberRole = Role.Member();

        await dbContext.Set<Role>().AddRangeAsync(adminRole, memberRole);
        await dbContext.SaveChangesAsync();

        var passwordHash = passwordHasher.Hash("Password123!");
        var account = new Account(member.Email, passwordHash, member.Id);
        account.Activate(); // Para garantir que está ativo

        account.AddRole(adminRole);

        member.LinkAccount(account.Id);

        await dbContext.Set<Account>().AddAsync(account);
        await dbContext.SaveChangesAsync();
    }
}
