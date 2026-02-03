using Domain.Entities.Wallets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.CurrentBalance)
            .HasPrecision(18, 2);

        // Relationships
        builder.HasOne(x => x.Family)
            .WithMany() // Assuming Family doesn't need a collection of Wallets for now, or we can add it later if needed.
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Owner)
            .WithMany() // Assuming Member does not have a collection of Wallets explicitly mapped yet.
            .HasForeignKey(x => x.OwnerId)
            .IsRequired(false) // Nullable
            .OnDelete(DeleteBehavior.Restrict); // Prevent deleting a member if they have wallets associated? Or SetNull? Restrict is safer.
    }
}
