using Domain.Entities.Incomes;
using Domain.Entities.Incomes.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class IncomeConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.ToTable("Incomes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description)
            .HasConversion(
                description => description.Value,
                value => IncomeDescription.Create(value)
            )
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => IncomeAmount.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(x => x.Date)
            .IsRequired(false);

        builder.Property(x => x.RecurringType)
            .HasConversion<int>()
            .IsRequired(false);

        builder.Property(x => x.Frequency)
            .HasConversion<int>()
            .IsRequired(false);

        builder.Property(x => x.DueDay)
            .HasConversion(
                dueDay => dueDay != null ? dueDay.Value : (int?)null,
                value => value.HasValue ? DueDay.Create(value.Value) : null
            )
            .IsRequired(false);

        builder.OwnsOne(x => x.Period, periodBuilder =>
        {
            periodBuilder.Property(p => p.StartDate).HasColumnName("StartDate").IsRequired();
            periodBuilder.Property(p => p.EndDate).HasColumnName("EndDate").IsRequired(false);
        });

        builder.Property(x => x.Status)
            .HasConversion(
                status => status != null ? status.IsActive : (bool?)null,
                value => value.HasValue ? (value.Value ? RecurringIncomeStatus.Active : RecurringIncomeStatus.Inactive) : null
            )
            .HasColumnName("Status")
            .IsRequired(false);

        builder.HasOne(x => x.Member)
            .WithMany(m => m.Incomes)
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
