using Domain.Entities.BankAccounts;
using Domain.Entities.Transactions.ValueObjects;
using Domain.Entities.Wallets;
using Domain.Entities.Categories;
using Domain.Entities.CreidtCards;
using Domain.Entities.Families;
using Domain.Entities.Transactions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description)
            .HasConversion(
                description => description.Value,
                value => TransactionDescription.Create(value)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Amount)
            .HasConversion(
                amount => amount.Value,
                value => TransactionAmount.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.Type)
            .IsRequired();

        builder.Property(x => x.Date)
            .IsRequired();

        builder.Property(x => x.FamilyId)
            .IsRequired();

        builder.Property(x => x.CategoryId)
            .IsRequired();

        builder.Property(x => x.WalletId)
            .IsRequired(false);

        builder.Property(x => x.BankAccountId)
            .IsRequired(false);

        builder.Property(x => x.CreditCardId)
            .IsRequired(false);

        builder.Property(x => x.UseCredit)
            .IsRequired(false);

        builder.OwnsOne(x => x.Metadata, metadata =>
        {
            metadata.Property(m => m.WalletName)
                .HasColumnName("WalletName")
                .HasMaxLength(100)
                .IsRequired(false);

            metadata.Property(m => m.BankAccountName)
                .HasColumnName("BankAccountName")
                .HasMaxLength(100)
                .IsRequired(false);

            metadata.Property(m => m.CreditCardDisplayName)
                .HasColumnName("CreditCardDisplayName")
                .HasMaxLength(150)
                .IsRequired(false);

            metadata.Property(m => m.Notes)
                .HasColumnName("Notes")
                .HasMaxLength(500)
                .IsRequired(false);
        });

        builder.HasOne<Wallet>()
            .WithMany(w => w.Transactions)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<BankAccount>()
            .WithMany()
            .HasForeignKey(x => x.BankAccountId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<CreditCard>()
            .WithMany()
            .HasForeignKey(x => x.CreditCardId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Family>()
            .WithMany()
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
