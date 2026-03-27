using Domain.Entities.Wallets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class WalletAccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("WalletAccounts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(x => x.Balance)
            .HasPrecision(18, 2);

        builder.Property(x => x.CreditLimit)
            .HasPrecision(18, 2);

        builder.Property(x => x.UsedCredit)
            .HasPrecision(18, 2);

        builder.Property(x => x.ClosingDay);

        builder.Property(x => x.DueDay);

        // Account -> Wallet relationship
        builder.HasOne(x => x.Wallet)
            .WithMany(w => w.Accounts)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Transactions)
            .WithOne(x => x.Account)
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Configure backing field for Transactions
        builder.Metadata.FindNavigation(nameof(Account.Transactions))
            ?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
