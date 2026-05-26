using Domain.Entities.Families;
using Domain.Entities.Families.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class FamilyConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> builder)
    {
        builder.ToTable("Families");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasConversion(
                name => name.Value,
                value => FamilyName.Create(value)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Status)
            .HasConversion(
                status => status.IsActive,
                value => value ? FamilyStatus.Active : FamilyStatus.Inactive
            )
            .IsRequired();

        builder.HasMany(x => x.Members)
            .WithOne(x => x.Family)
            .HasForeignKey(x => x.FamilyId)
            .Metadata.PrincipalToDependent!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
