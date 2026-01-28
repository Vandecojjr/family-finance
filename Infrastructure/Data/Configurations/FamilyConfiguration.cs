using Domain.Entities.Families;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class FamilyConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> builder)
    {
        // builder.ToTable("Families");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.NumberMember)
            .IsRequired();

        builder.HasMany(x => x.Members)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
    }
}
