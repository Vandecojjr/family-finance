using Domain.Entities.RecurringIncomes;
using Domain.Entities.RecurringIncomes.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class RecurringIncomeConfiguration : IEntityTypeConfiguration<RecurringIncome>
{
    public void Configure(EntityTypeBuilder<RecurringIncome> builder)
    {
        builder.ToTable("RecurringIncomes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description)
            .HasConversion(
                description => description.Value,
                value => RecurringIncomeDescription.Create(value)
            )
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => RecurringIncomeAmount.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(x => x.Frequency)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(x => x.DueDay)
            .HasConversion(
                dueDay => dueDay.Value,
                value => DueDay.Create(value)
            )
            .IsRequired();

        builder.OwnsOne(x => x.Period, period =>
        {
            period.Property(p => p.StartDate)
                .HasColumnName("StartDate")
                .IsRequired();

            period.Property(p => p.EndDate)
                .HasColumnName("EndDate")
                .IsRequired(false);
        });

        builder.Property(x => x.Status)
            .HasConversion(
                status => status.IsActive,
                value => value ? RecurringIncomeStatus.Active : RecurringIncomeStatus.Inactive
            )
            .IsRequired();

        builder.HasOne(x => x.Member)
            .WithMany(m => m.RecurringIncomes)
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
