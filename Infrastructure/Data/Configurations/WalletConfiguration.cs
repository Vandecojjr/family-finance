using Domain.Entities.Wallets;
using Domain.Entities.Wallets.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasConversion(
                name => name.Value,
                value => WalletName.Create(value)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.CashBalance)
            .HasConversion(
                cashBalance => cashBalance.Value,
                value => CashBalance.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.FamilyId)
            .IsRequired();

        builder.HasMany(x => x.Accounts)
            .WithOne(x => x.Wallet)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade)
            .Metadata.PrincipalToDependent!.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(x => x.Transactions)
            .WithOne()
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.SetNull)
            .Metadata.PrincipalToDependent!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
