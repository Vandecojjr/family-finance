using Domain.Entities.PlannedIncomes;
using Domain.Entities.PlannedIncomes.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PlannedIncomeConfiguration : IEntityTypeConfiguration<PlannedIncome>
{
    public void Configure(EntityTypeBuilder<PlannedIncome> builder)
    {
        builder.ToTable("PlannedIncomes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description)
            .HasConversion(
                description => description.Value,
                value => PlannedIncomeDescription.Create(value)
            )
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => PlannedIncomeAmount.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.Date)
            .IsRequired();

        builder.HasOne(x => x.Member)
            .WithMany()
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
