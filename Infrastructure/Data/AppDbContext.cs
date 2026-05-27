using Domain.Entities.Categories;
using Domain.Entities.RecurringExpenses;
using Domain.Entities.RecurringIncomes;
using Domain.Entities.PlannedIncomes;
using Domain.Entities.PlannedExpenses;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<RecurringExpense> RecurringExpenses { get; set; } = null!;
    public DbSet<RecurringIncome> RecurringIncomes { get; set; } = null!;
    public DbSet<PlannedIncome> PlannedIncomes { get; set; } = null!;
    public DbSet<PlannedExpense> PlannedExpenses { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(Domain.Shared.Entities.Entity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).Property("Id").ValueGeneratedNever();
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Shared.Entities.Entity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.SeUpdate();
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
