using Domain.Entities.CreidtCards;
using Domain.Entities.CreidtCards.ValueObjects;
using Domain.Entities.Wallets;
using Domain.Entities.Wallets.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CreditCardConfiguration : IEntityTypeConfiguration<CreditCard>
{
    public void Configure(EntityTypeBuilder<CreditCard> builder)
    {
        builder.ToTable("CreditCards");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Brand)
            .HasConversion(
                brand => brand.Value,
                value => CreditCardBrand.Create(value)
            )
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.LastFourDigits)
            .HasConversion(
                lastFourDigits => lastFourDigits.Value,
                value => LastFourDigits.Create(value)
            )
            .IsRequired()
            .HasMaxLength(4)
            .IsFixedLength();

        builder.Property(x => x.TotalLimit)
            .HasConversion(
                totalLimit => totalLimit.Value,
                value => CreditCardLimit.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.RemainingLimit)
            .HasConversion(
                remainingLimit => remainingLimit.Value,
                value => CreditCardLimit.Create(value)
            )
            .IsRequired()
            .HasPrecision(18, 2);
    }
}
