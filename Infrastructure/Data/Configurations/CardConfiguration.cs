using Domain.Entities.Wallets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CardConfiguration : IEntityTypeConfiguration<Card>
{
    public void Configure(EntityTypeBuilder<Card> builder)
    {
        builder.ToTable("Cards");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.Limit)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.UsedLimit)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(x => x.ClosingDay)
            .IsRequired();

        builder.Property(x => x.DueDay)
            .IsRequired();

        builder.HasOne(x => x.Account)
            .WithMany(a => a.Cards)
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
