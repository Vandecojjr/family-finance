using Domain.Entities.CreidtCards;
using Domain.Entities.CreidtCards.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CreditCardInvoiceConfiguration : IEntityTypeConfiguration<CreditCardInvoice>
{
    public void Configure(EntityTypeBuilder<CreditCardInvoice> builder)
    {
        builder.ToTable("CreditCardInvoices");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.DueDate)
            .HasConversion(
                dueDate => dueDate.Value,
                value => InvoiceDueDate.Create(value)
            )
            .IsRequired();

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => InvoiceAmount.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.HasOne(x => x.CreditCard)
            .WithMany(x => x.Invoices)
            .HasForeignKey(x => x.CreditCardId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Expense)
            .WithMany()
            .HasForeignKey(x => x.ExpenseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
