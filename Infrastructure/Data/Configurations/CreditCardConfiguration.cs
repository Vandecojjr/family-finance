using Domain.Entities.Wallets;
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
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.LastFourDigits)
            .IsRequired()
            .HasMaxLength(4)
            .IsFixedLength();

        builder.Property(x => x.TotalLimit)
            .IsRequired()
            .HasPrecision(18, 2);
    }
}
