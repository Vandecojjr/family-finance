using Domain.AccessContext.Entities.Accounts;
using Domain.AccessContext.Entities.Accounts.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email)
            .HasConversion(
                email => email.Value,
                value => Email.Create(value)
            )
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(x => x.Email)
            .IsUnique();

        builder.Property(x => x.PasswordHash)
            .HasConversion(
                hash => hash.Value,
                value => PasswordHash.Create(value)
            )
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasOne(x => x.Member)
            .WithOne(x => x.Account)
            .HasForeignKey<Account>(x => x.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.RefreshTokens)
            .WithOne()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
