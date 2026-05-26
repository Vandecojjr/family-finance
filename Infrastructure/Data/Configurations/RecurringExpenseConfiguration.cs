using Domain.Entities.RecurringExpenses;
using Domain.Entities.RecurringExpenses.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class RecurringExpenseConfiguration : IEntityTypeConfiguration<RecurringExpense>
{
    public void Configure(EntityTypeBuilder<RecurringExpense> builder)
    {
        builder.ToTable("RecurringExpenses");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description)
            .HasConversion(
                description => description.Value,
                value => RecurringExpenseDescription.Create(value)
            )
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => RecurringExpenseAmount.Create(value)
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
                value => value ? RecurringExpenseStatus.Active : RecurringExpenseStatus.Inactive
            )
            .IsRequired();

        builder.HasOne(x => x.Member)
            .WithMany(m => m.RecurringExpenses)
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
