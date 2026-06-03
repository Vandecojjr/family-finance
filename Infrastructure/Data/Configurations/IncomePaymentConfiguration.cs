using Domain.Entities.Incomes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class IncomePaymentConfiguration : IEntityTypeConfiguration<IncomePayment>
{
    public void Configure(EntityTypeBuilder<IncomePayment> builder)
    {
        builder.ToTable("IncomePayments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Month)
            .IsRequired();

        builder.Property(x => x.Year)
            .IsRequired();

        builder.Property(x => x.AmountReceived)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.ReceivedAt)
            .IsRequired();

        builder.HasOne<Income>()
            .WithMany(re => re.Payments)
            .HasForeignKey(x => x.IncomeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
