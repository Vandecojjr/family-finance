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

        // Capabilities
        builder.Property(x => x.IsDebit).IsRequired();
        builder.Property(x => x.IsCredit).IsRequired();
        builder.Property(x => x.IsInvestment).IsRequired();
        builder.Property(x => x.IsCash).IsRequired();

        builder.Property(x => x.Balance)
            .HasPrecision(18, 2);

        // Pre-approved credit
        builder.Property(x => x.PreApprovedCreditLimit)
            .HasPrecision(18, 2);

        builder.Property(x => x.UsedPreApprovedCredit)
            .HasPrecision(18, 2);

        // Account -> Wallet relationship
        builder.HasOne(x => x.Wallet)
            .WithMany(w => w.Accounts)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Cards)
            .WithOne(c => c.Account)
            .HasForeignKey(c => c.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Transactions)
            .WithOne(x => x.Account)
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Configure backing fields
        builder.Metadata.FindNavigation(nameof(Account.Transactions))
            ?.SetPropertyAccessMode(PropertyAccessMode.Field);
            
        builder.Metadata.FindNavigation(nameof(Account.Cards))
            ?.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
