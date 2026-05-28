using Domain.Entities.RecurringExpenses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class RecurringExpensePaymentConfiguration : IEntityTypeConfiguration<RecurringExpensePayment>
{
    public void Configure(EntityTypeBuilder<RecurringExpensePayment> builder)
    {
        builder.ToTable("RecurringExpensePayments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Month)
            .IsRequired();

        builder.Property(x => x.Year)
            .IsRequired();

        builder.Property(x => x.AmountPaid)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.PaidAt)
            .IsRequired();

        builder.HasOne<RecurringExpense>()
            .WithMany(re => re.Payments)
            .HasForeignKey(x => x.RecurringExpenseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
