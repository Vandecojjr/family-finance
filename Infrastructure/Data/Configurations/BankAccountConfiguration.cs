using Domain.Entities.BankAccounts;
using Domain.Entities.BankAccounts.ValueObjects;
using Domain.Entities.Wallets;
using Domain.Entities.Wallets.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BankAccountConfiguration : IEntityTypeConfiguration<BankAccount>
{
    public void Configure(EntityTypeBuilder<BankAccount> builder)
    {
        builder.ToTable("BankAccounts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.BankName)
            .HasConversion(
                bankName => bankName.Value,
                value => BankName.Create(value)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(x => x.DebitBalance)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.CreditLimit)
            .HasConversion(
                creditLimit => creditLimit.Value,
                value => CreditLimit.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.RemainingCreditLimit)
            .HasConversion(
                creditLimit => creditLimit.Value,
                value => CreditLimit.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.HasMany(x => x.CreditCards)
            .WithOne(x => x.BankAccount)
            .HasForeignKey(x => x.BankAccountId)
            .OnDelete(DeleteBehavior.Cascade)
            .Metadata.PrincipalToDependent!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
